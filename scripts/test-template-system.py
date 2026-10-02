"""Local browser QA. Run against `npm run dev -- -p 3016`.

Requires Python playwright and Pillow, and installed Chrome. Creates a temporary
QA route using the REAL Schedule page/provider, then removes it in finally.
No production accounts or database writes are used. Output goes to scratch/.
"""
import argparse, json, sys, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
if (ROOT / 'scratch/qa-python').exists():
    sys.path.insert(0, str(ROOT / 'scratch/qa-python'))
from playwright.sync_api import sync_playwright
from PIL import Image

NAMES = ['Ultra Pink','Pink Notebook','Cute Cat Blue','Ocean Party','Sage Green Nature','Forest Whimsy','Dormosaur Adventure','Dormosaur Night Mode']
IDS = ['ultra-pink','pink-notebook','cute-cat-blue','ocean-party','sage-green','forest-whimsy','dormosaur-adventure','dormosaur-night-mode']
QA_SOURCE = """'use client'
import { ScheduleProvider } from '@/components/schedule-provider'
import SchedulePage from '@/app/(main)/schedule/page'
export default function TemplateQaPage() { return <ScheduleProvider><SchedulePage /></ScheduleProvider> }
"""

def fixture(count=14):
    result=[]
    days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    for index in range(count):
        hour=7+(index//7)*2
        result.append(dict(id=f'qa-{index}',code='CPE-414-ADVANCED-LABORATORY' if index==0 else f'CPE {410+index}',subject='A very long subject name that must not crowd the course code',instructor='TBA',room='RM 202',days=[days[index%7]],start=f'{hour:02}:00',end=f'{hour+2:02}:30',color=index%5+1))
    return result

def seed(page, classes):
    page.add_init_script('localStorage.setItem("dormosaur_classes_v1", '+json.dumps(json.dumps(classes))+'); localStorage.setItem("dormosaur_profile_v1", JSON.stringify({name:"QA Student",school:"Test University",initials:"QA",appliances:[]}));')

def open_picker(page):
    candidates=page.get_by_role('button', name='Choose Theme', exact=True)
    if candidates.count() and candidates.first.is_visible(): candidates.first.click()
    else: page.get_by_role('button', name='Schedule Wallpapers & Visual Themes', exact=True).click()
    page.get_by_role('heading',name='Choose a Template',exact=True).wait_for()

def settle(page):
    page.evaluate('async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll("[data-template-artboard] img")].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))}')

def assert_preview(page, expected_classes):
    settle(page)
    result=page.locator('[data-scaled-preview]').evaluate('''e=>{
      const a=e.querySelector('[data-template-artboard]').getBoundingClientRect(), c=e.getBoundingClientRect();
      const boxes=[...e.querySelectorAll('[data-wallpaper-class]')].map(x=>x.getBoundingClientRect());
      const dialog=e.closest('[role="dialog"]');
      return {ratio:a.width/a.height,inside:a.left>=c.left-.5&&a.right<=c.right+.5&&a.top>=c.top-.5&&a.bottom<=c.bottom+.5,classes:boxes.length,allClassesInside:boxes.every(x=>x.left>=a.left-.5&&x.right<=a.right+.5&&x.bottom<=a.bottom+.5),horizontal:dialog.scrollWidth>dialog.clientWidth};
    }''')
    assert abs(result['ratio']-9/16)<.001, result
    assert result['inside'] and result['allClassesInside'] and not result['horizontal'], result
    assert result['classes']==expected_classes, result
    footer=page.get_by_role('button',name='Use This Template',exact=True).bounding_box()
    assert footer['y']+footer['height']<=page.viewport_size['height']+.5

def export(page, out, fmt, preset, template_id):
    page.get_by_role('button',name={'phone':'Phone','desktop':'Desktop','print':'Print A4'}[preset],exact=True).click()
    page.get_by_role('button',name=fmt.lower(),exact=True).click()
    settle(page)
    expected={'phone':(390,390*16/9),'desktop':(1200,750),'print':(794,1123)}[preset]
    geometry=page.locator('#schedule-export-artboard').evaluate('(e)=>({width:e.offsetWidth,height:e.offsetHeight,transform:getComputedStyle(e).transform,classes:e.querySelectorAll("[data-wallpaper-class]").length,name:e.textContent.includes("QA Student")})')
    assert geometry['width']==expected[0] and abs(geometry['height']-expected[1])<1 and geometry['transform']=='none' and geometry['name'], geometry
    with page.expect_download(timeout=120000) as download:
        page.get_by_role('button',name=f'Download {fmt.lower()}',exact=True).click()
    target=out/download.value.suggested_filename
    download.value.save_as(target)
    assert target.stat().st_size>10000
    if fmt!='PDF':
        image=Image.open(target).convert('RGB')
        assert abs(image.width-expected[0]*3)<2 and abs(image.height-expected[1]*3)<2, image.size
        # The artwork's top-left corner is deliberately left uncovered. This
        # catches blank/missing backgrounds in the ACTUAL downloaded file.
        original=Image.open(ROOT/f'public/templates/backgrounds/{template_id}.png').convert('RGB')
        ratio=max(image.width/original.width,image.height/original.height)
        original=original.resize((round(original.width*ratio),round(original.height*ratio)))
        left=(original.width-image.width)//2; top=(original.height-image.height)//2
        a=image.getpixel((8,8)); b=original.getpixel((left+8,top+8))
        assert max(abs(x-y) for x,y in zip(a,b))<45,(a,b)
    else:
        pdf=target.read_bytes()
        assert pdf.startswith(b'%PDF') and b'/Subtype /Image' in pdf
        bounds=re.search(rb'/MediaBox\s*\[([^\]]+)\]',pdf)
        media=[float(value) for value in bounds[1].split()]
        ratio=(media[2]-media[0])/(media[3]-media[1])
        assert abs(ratio-9/16)<.001 if preset=='phone' else ratio>1 if preset=='desktop' else ratio<1
    print(f'PASS export {template_id} {preset} {fmt}', flush=True)

def run(url,out,presets_only=False):
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='chrome',headless=True)
        try:
            if presets_only:
                page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce',accept_downloads=True)
                seed(page,fixture());page.goto(url+'/template-qa');page.wait_for_load_state('networkidle');open_picker(page)
                page.get_by_role('button',name='Preview Ultra Pink',exact=True).click()
                page.get_by_role('button',name='Use This Template',exact=True).click()
                for preset in ['desktop','print']:
                    for fmt in ['PNG','JPEG','PDF']: export(page,out,fmt,preset,'ultra-pink')
                page.close()
                return
            for width in [375,390,414,430,768,1440]:
                page=browser.new_page(viewport={'width':width,'height':844 if width<768 else 900},reduced_motion='reduce',accept_downloads=True)
                page.on('pageerror',lambda error:errors.append(str(error)))
                page.on('console',lambda message: errors.append(message.text) if message.type=='error' else None)
                seed(page,fixture())
                page.goto(url+'/template-qa'); page.wait_for_load_state('networkidle')
                open_picker(page)
                assert page.get_by_role('button',name='Preview ',exact=False).count()==8
                assert page.locator('[data-template-artboard]').count()==0, 'Picker must not mount a large live preview'
                columns=page.locator('[data-template-picker-grid]').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length')
                assert columns==(2 if width<640 else 3 if width<1024 else 4)
                page.screenshot(path=str(out/f'picker-{width}.png'))
                for name,template_id in zip(NAMES,IDS):
                    page.get_by_role('button',name=f'Preview {name}',exact=True).click()
                    assert_preview(page,len(fixture()))
                    page.screenshot(path=str(out/f'{template_id}-{width}.png'))
                    if template_id in ['sage-green','dormosaur-night-mode']:
                        assert page.locator('thead th').all_text_contents()==['TIME','MON','TUE','WED','THU','FRI']
                        assert page.get_by_role('heading',name='WEEKEND',exact=True).count()==1
                    if width==390:
                        page.get_by_role('button',name='Use This Template',exact=True).click()
                        assert page.get_by_role('button',name='Phone',exact=True).get_attribute('aria-pressed')=='true'
                        for fmt in ['PNG','JPEG','PDF']: export(page,out,fmt,'phone',template_id)
                        page.get_by_role('button',name='Preview',exact=True).click()
                    if width==1440 and template_id in ['sage-green','ultra-pink']:
                        page.get_by_role('button',name='Use This Template',exact=True).click()
                        assert page.get_by_role('button',name='Desktop',exact=True).get_attribute('aria-pressed')=='true'
                        for preset in ['desktop','print']:
                            for fmt in ['PNG','JPEG','PDF']: export(page,out,fmt,preset,template_id)
                        page.get_by_role('button',name='Preview',exact=True).click()
                    page.get_by_role('button',name='Change Template',exact=True).click()
                page.keyboard.press('Escape')
                page.get_by_role('dialog').wait_for(state='hidden')
                assert page.get_by_role('dialog').count()==0
                print(f'PASS picker/preview/return/Escape at {width}px',flush=True)
                page.close()
            for classes,label in [(fixture(35),'dense'),([], 'empty')]:
                page=browser.new_page(viewport={'width':375,'height':667},reduced_motion='reduce')
                seed(page,classes); page.goto(url+'/template-qa');page.wait_for_load_state('networkidle');open_picker(page)
                for name,template_id in zip(NAMES,IDS):
                    page.get_by_role('button',name=f'Preview {name}',exact=True).click()
                    assert_preview(page,len(classes))
                    if not classes: assert page.locator('[data-template-artboard]').get_by_text('No classes yet',exact=True).count()==1
                    page.screenshot(path=str(out/f'{template_id}-{label}.png'))
                    page.get_by_role('button',name='Change Template',exact=True).click()
                print(f'PASS {label} schedules at 375x667',flush=True)
                page.close()
            assert not errors,errors
        finally: browser.close()

if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('--url',default='http://localhost:3016');args.add_argument('--presets-only',action='store_true');opts=args.parse_args()
    route=ROOT/'app/template-qa/page.tsx'
    if route.exists(): raise RuntimeError('Refusing to overwrite an existing QA route')
    route.parent.mkdir(exist_ok=True)
    route.write_text(QA_SOURCE,encoding='utf-8')
    out=ROOT/'scratch/template-qa-output';out.mkdir(parents=True,exist_ok=True)
    try: run(opts.url,out,opts.presets_only)
    finally:
        if route.resolve().parent!=ROOT/'app/template-qa': raise RuntimeError('Unexpected temporary route path')
        route.unlink()
