/**
 * Dormosaur Help content. Every fact here is checked against the Android app in mobile/.
 * Inline syntax in strings: **bold** for UI labels, [text](/docs/slug) for links.
 */

export type Block =
  | { h2: string }
  | { p: string }
  | { steps: string[] }
  | { list: string[] }
  | { callout: 'note' | 'tip' | 'warn'; title: string; body: string }
  | { cards: { slug: string; blurb: string }[] }
  | { contact: true }

export type DocPage = {
  slug: string
  title: string
  description: string
  group: string
  body: Block[]
  next?: string[]
}

export const GROUPS = ['Start here', 'Your day', 'Dorm kitchen', 'Dormo', 'On your phone', 'Account & data', 'Help'] as const

export const pages: DocPage[] = [
  // ─── Start here ────────────────────────────────────────────────────────
  {
    slug: '',
    title: 'Dormosaur Help',
    group: 'Start here',
    description: 'Set up your class schedule, learn the app, and fix common problems with scanning, alarms, tasks, and the dorm kitchen.',
    body: [
      { p: 'Dormosaur keeps your class schedule, class alarms, deadlines, and dorm meals together on your Android phone. Scan the timetable you already have, check every class, and let Dormo handle the reminders.' },
      { p: 'These guides explain the app in short, task-focused steps. Labels in **bold** match what you see on screen.' },
      { h2: 'Start here' },
      { cards: [
        { slug: 'getting-started', blurb: 'The shortest path from install to a working week.' },
        { slug: 'install', blurb: 'Download the APK and install it on Android.' },
        { slug: 'import', blurb: 'Scan a screenshot, photo, PDF, or pasted text.' },
      ] },
      { h2: 'Find the right guide' },
      { list: [
        '**Your day** covers [Today](/docs/today), [Schedule](/docs/schedule), [classes](/docs/classes), [class alarms](/docs/alarms), and [tasks](/docs/tasks).',
        '**Dorm kitchen** covers [recipes](/docs/recipes), the [meal plan, and the grocery list](/docs/meal-plan).',
        '**Dormo** explains [Ask Dormo](/docs/ask-dormo), the assistant that knows your week.',
        '**On your phone** covers the [schedule wallpaper and widgets](/docs/wallpaper-widgets).',
        '**Account & data** explains [sign-in](/docs/account), [settings](/docs/settings), [permissions](/docs/permissions), and [privacy](/docs/privacy).',
        '**Help** has the [FAQ](/docs/faq), [troubleshooting](/docs/troubleshooting), and [how to reach us](/docs/contact).',
      ] },
      { h2: 'App map' },
      { p: 'The tab bar has **Today**, **Schedule**, **Tasks**, and **Kitchen**, plus a separate **+** button. Use **+** to scan your schedule, paste text, import a file, add a class by hand, add a task, or scan a syllabus.' },
      { p: 'On **Today**, your avatar in the top corner opens **Settings**, where you also find **Class alarms**, the **Schedule scanner**, and the **Schedule wallpaper**.' },
      { callout: 'note', title: 'Free, no ads', body: 'Dormosaur is free to download and has zero ads. Nothing in the app is locked behind a payment.' },
    ],
    next: ['getting-started'],
  },
  {
    slug: 'getting-started',
    title: 'Getting started',
    group: 'Start here',
    description: 'Install Dormosaur, create your account, scan your schedule, and check your alarms in a few minutes.',
    body: [
      { p: 'You can go from install to a full week with alarms in about five minutes. You need your class schedule as a screenshot, photo, PDF, or text.' },
      { h2: 'Set up in five steps' },
      { steps: [
        '[Install the APK](/docs/install) on your Android phone and open **Dormosaur**.',
        'Tap **Let’s get started!** to create an account, or **Log in** if you already have one. You can use email or **Continue with Google**.',
        'Answer three quick questions: your first name, where you study, and whether you live in a dorm.',
        'On **Today**, tap **Scan your schedule** and choose a screenshot, PDF, photo, or pasted text.',
        'Check every class on the review screen, fix anything marked **Time missing** or **Day missing**, then save.',
      ] },
      { p: 'Your classes now appear on **Today** and **Schedule**, and each class gets an alarm automatically.' },
      { callout: 'tip', title: 'Best source for an exact read', body: 'If your school portal lets you download the schedule as a PDF, use that. A screenshot of the portal is the next best option.' },
      { h2: 'Allow notifications' },
      { p: 'Android asks for notification permission the first time Dormosaur sets your alarms. Allow it, or class alarms cannot ring. You can change this later in Android settings. See [Permissions](/docs/permissions).' },
      { h2: 'What to try next' },
      { list: [
        'Pick how early each alarm rings in [Class alarms](/docs/alarms).',
        'Add your first deadline in [Tasks](/docs/tasks), or scan a syllabus.',
        'Plan a few cheap meals in the [Kitchen](/docs/recipes).',
      ] },
    ],
    next: ['install', 'import'],
  },
  {
    slug: 'install',
    title: 'Install the APK',
    group: 'Start here',
    description: 'Download the Dormosaur APK from the website and install it on an Android phone.',
    body: [
      { p: 'Dormosaur is shipped directly as an Android APK while store listings are prepared. The APK on the website is the same signed build we use ourselves.' },
      { h2: 'Requirements' },
      { list: ['An Android phone running Android 8 or later.', 'An internet connection for sign-in and scanning.'] },
      { h2: 'Install' },
      { steps: [
        'Open [dormosaur.vercel.app](/) on your phone and tap **Download the APK**.',
        'When the download finishes, tap the notification or open the file from **Downloads**.',
        'If Android asks, allow your browser to **Install unknown apps**. Android shows this once per browser.',
        'Tap **Install**, then **Open**.',
      ] },
      { callout: 'warn', title: 'Only install from the official site', body: 'Download the APK only from the Dormosaur website. A copy from a group chat or file-sharing site may be modified.' },
      { h2: 'Update to a new version' },
      { p: 'Download the newer APK from the website and install it over the existing app. Your account data stays, because it is stored with your account, not in the app file.' },
      { h2: 'iPhone' },
      { p: 'An iPhone version is on the roadmap. For now, Dormosaur is available for Android only.' },
    ],
    next: ['getting-started', 'import'],
  },
  {
    slug: 'import',
    title: 'Import your schedule',
    group: 'Start here',
    description: 'Turn a screenshot, photo, PDF, or pasted text into a weekly schedule, then review every class before saving.',
    body: [
      { p: 'The **Schedule scanner** reads subjects, codes, rooms, instructors, days, and times, then lays out your week. Nothing is saved until you confirm it.' },
      { p: 'Open the scanner from **Scan your schedule** on Today, from **Scan schedule** on an empty Schedule tab, from **+ ▸ Scan photo**, or from **Settings ▸ Schedule scanner**.' },
      { h2: 'Choose a source' },
      { list: [
        '**Choose screenshot**: best for portal schedules.',
        '**Import PDF or file**: an exact read of portal PDFs.',
        '**Take a photo**: hold the phone level over the printed page.',
        '**Paste text**: lists like `MATH 101 MWF 8:30-9:50`.',
      ] },
      { callout: 'tip', title: 'For the most exact read', body: 'Use the original PDF or a screenshot. Text copied from a timetable loses its columns, so days and times have to be guessed.' },
      { h2: 'Limits' },
      { list: [
        'A PDF can be up to 3 MB. If yours is bigger, export only the schedule page.',
        'Large photos are resized automatically so small portal text stays readable and uploads stay fast.',
        'Scanning needs an internet connection.',
      ] },
      { h2: 'Review what was found' },
      { p: 'Dormo shows each class it found. Classes it is unsure about are flagged.' },
      { steps: [
        'Tap any class to edit its name, code, room, days, or times.',
        'Fix every class marked **Time missing** or **Day missing**. Incomplete classes cannot be saved.',
        'Untick classes you do not want.',
        'Save. Each saved class gets a class alarm automatically.',
      ] },
      { p: 'Scanning the same schedule twice will not create duplicates. If every class is already saved, Dormo tells you so.' },
      { h2: 'Add classes by hand' },
      { p: 'Choose **+ ▸ Add manually** when you have only a few classes or the source is hard to read. See [Classes](/docs/classes).' },
    ],
    next: ['schedule', 'classes'],
  },

  // ─── Your day ──────────────────────────────────────────────────────────
  {
    slug: 'today',
    title: 'Today',
    group: 'Your day',
    description: 'See the class happening now, your next class with a countdown, and the tasks due soon on one screen.',
    body: [
      { p: '**Today** is the first tab. It answers one question: what do I need to do next?' },
      { h2: 'What you see' },
      { list: [
        'A countdown card for the class **Happening now** or **Up next**, with its room.',
        'The rest of today’s classes in order. Tap one to open it.',
        '**Due soon**: your nearest deadlines. Tap **All tasks** to open the Tasks tab.',
        'A meal idea from the Kitchen when you have one planned.',
      ] },
      { h2: 'Empty days' },
      { p: 'With no classes saved, Today shows **Add your schedule**. Tap **Scan your schedule** to start. On a day without classes, you see **Free day**. When the last class ends, Today shows **Classes done for today**.' },
      { h2: 'Shortcuts' },
      { list: ['Your avatar opens [Settings](/docs/settings).', 'The alarm button opens [Class alarms](/docs/alarms).', 'The Dormo button opens [Ask Dormo](/docs/ask-dormo).'] },
    ],
    next: ['schedule', 'tasks'],
  },
  {
    slug: 'schedule',
    title: 'Schedule',
    group: 'Your day',
    description: 'View your whole week or a single day, search your classes, and open any class to edit it.',
    body: [
      { p: 'The **Schedule** tab shows every saved class, coloured by subject.' },
      { h2: 'Week and Day views' },
      { p: 'Switch between **Week** and **Day** at the top. Week shows your whole timetable at a glance. Day shows one day as a list, which is easier to read on a small screen.' },
      { h2: 'Search' },
      { p: 'Use **Search classes, rooms, instructors** to find a class fast, for example a room before an exam.' },
      { h2: 'Edit a class' },
      { p: 'Tap any class to open it. See [Classes](/docs/classes).' },
      { callout: 'tip', title: 'Put your week on your Lock Screen', body: 'Tap **Home screen widgets** on Schedule to preview widgets and make a [schedule wallpaper](/docs/wallpaper-widgets).' },
    ],
    next: ['classes', 'wallpaper-widgets'],
  },
  {
    slug: 'classes',
    title: 'Classes',
    group: 'Your day',
    description: 'Add a class by hand, edit its details and colour, or delete it.',
    body: [
      { h2: 'Add a class' },
      { steps: [
        'Tap **+** and choose **Add manually**.',
        'Enter the subject, course code, and room. For example: Calculus I, MATH 101, Sci 204.',
        'Choose the **Days** and the start and end time.',
        'Pick a **Color** and save.',
      ] },
      { p: 'Dormo creates a class alarm for the new class automatically.' },
      { h2: 'Edit a class' },
      { p: 'Tap the class on Today or Schedule. Change any field, then save. Its alarm follows the new days and time.' },
      { h2: 'Delete a class' },
      { p: 'Open the class and tap **Delete class**. Dormo asks you to confirm, then removes the class and its alarm.' },
    ],
    next: ['alarms'],
  },
  {
    slug: 'alarms',
    title: 'Class alarms',
    group: 'Your day',
    description: 'Get a reminder 15, 30, or 60 minutes before every class, even with no signal.',
    body: [
      { p: '**Class alarms** ring before every class, even offline. Each class gets an alarm automatically when you add it.' },
      { p: 'Open **Class alarms** from the alarm button on Today or from **Settings ▸ Class alarms**.' },
      { h2: 'Change when an alarm rings' },
      { steps: ['Tap the alarm to expand it.', 'Choose **15 min**, **30 min**, or **60 min** before class.'] },
      { p: 'The big time on each row shows exactly when it will ring.' },
      { h2: 'Turn an alarm off' },
      { p: 'Use the switch on the alarm row. The class stays on your schedule.' },
      { callout: 'note', title: 'Why alarms work offline', body: 'Dormosaur schedules alarms on your phone as Android notifications, so they ring without a connection. They need notification permission. See [Permissions](/docs/permissions).' },
      { callout: 'tip', title: 'Alarms not ringing?', body: 'Some phones pause apps to save battery. See [Troubleshooting](/docs/troubleshooting#alarms-do-not-ring).' },
    ],
    next: ['tasks', 'troubleshooting'],
  },
  {
    slug: 'tasks',
    title: 'Tasks & deadlines',
    group: 'Your day',
    description: 'Track exams, quizzes, assignments, and projects, or scan a syllabus to pull out every due date.',
    body: [
      { p: 'The **Tasks** tab is your **Deadline tracker**. It groups tasks by when they are due, shows what is overdue, and tracks how much you have finished.' },
      { h2: 'Add a task' },
      { steps: ['Tap **New task** on Tasks, or **+ ▸ New task**.', 'Pick a type: exam, quiz, assignment, project, or other.', 'Link it to a class if you like, set the due date and time, and save.'] },
      { h2: 'Scan a syllabus' },
      { p: 'Dormo can find every due date in a syllabus, announcement, or class post.' },
      { steps: [
        'Choose **+ ▸ Scan syllabus**.',
        'Take a photo, choose an image, import a PDF, or paste the text.',
        'Tap **Find deadlines** and review the results.',
        'Fix anything marked **Check date** or **Check time**, then save.',
      ] },
      { p: 'A deadline with no time is set to 11:59 PM on its due date.' },
      { h2: 'Finish a task' },
      { p: 'Tick it off. It moves to **Done**. When nothing is left, Tasks shows **All clear**.' },
    ],
    next: ['today', 'alarms'],
  },

  // ─── Dorm kitchen ──────────────────────────────────────────────────────
  {
    slug: 'recipes',
    title: 'Recipes',
    group: 'Dorm kitchen',
    description: 'Browse dorm-budget recipes made for a rice cooker, kettle, or microwave.',
    body: [
      { p: 'The **Kitchen** tab opens on **Recipes**: 24 dorm-budget meals built for small spaces and simple appliances.' },
      { h2: 'Find a recipe' },
      { p: 'Filter by **All**, **Breakfast**, **Lunch**, **Dinner**, or **Snack**, then tap a recipe to see its **Ingredients** and **Steps**.' },
      { h2: 'Shop for what you are missing' },
      { p: 'On a recipe, tick the ingredients you already have, then tap **Add missing to grocery**. The rest go straight to your [grocery list](/docs/meal-plan).' },
      { callout: 'tip', title: 'Tuned for dorms', body: 'If you said you live in a dorm during setup, the Kitchen favours recipes that fit dorm appliances.' },
    ],
    next: ['meal-plan'],
  },
  {
    slug: 'meal-plan',
    title: 'Meal plan & grocery list',
    group: 'Dorm kitchen',
    description: 'Plan meals for the week and build a grocery list from them in one tap.',
    body: [
      { h2: 'Plan your meals' },
      { steps: ['Open **Kitchen ▸ Meal plan**.', 'Tap a meal slot on any day.', 'Pick a recipe. To empty a slot, choose **Clear this meal**.'] },
      { p: 'Today’s planned meal also shows on the Today tab.' },
      { h2: 'Build your grocery list' },
      { list: [
        'In **Kitchen ▸ Grocery**, tap **Add ingredients from meal plan** to add everything your plan needs.',
        'Use **Add item** for anything else.',
        'Tick items off as you shop.',
      ] },
    ],
    next: ['recipes'],
  },

  // ─── Dormo ─────────────────────────────────────────────────────────────
  {
    slug: 'ask-dormo',
    title: 'Ask Dormo',
    group: 'Dormo',
    description: 'Ask Dormo about your week, your free time, what is due, or what to cook.',
    body: [
      { p: 'Dormo is a chat assistant that knows your classes and deadlines. Open it from the Dormo button on Today or from **Settings**.' },
      { h2: 'Things to ask' },
      { list: ['What’s next today?', 'When am I free this week?', 'What’s due soon?', 'Quick dinner idea'] },
      { p: 'Tap a suggestion or type your own question in **Ask about your week**.' },
      { callout: 'note', title: 'Needs a connection', body: 'Ask Dormo works online. If Dormo cannot answer, you will see a short message. Try again in a moment.' },
    ],
    next: ['privacy'],
  },

  // ─── On your phone ─────────────────────────────────────────────────────
  {
    slug: 'wallpaper-widgets',
    title: 'Wallpaper & widgets',
    group: 'On your phone',
    description: 'Put your weekly schedule on your Lock Screen as a wallpaper, share it, and preview home screen widgets.',
    body: [
      { h2: 'Make a schedule wallpaper' },
      { p: 'A schedule wallpaper puts your week on your Lock Screen. It sits between the clock and the bottom buttons, and resizes to fit your week.' },
      { steps: [
        'Open **Settings ▸ Schedule wallpaper**, or **Make a schedule wallpaper** from the widgets screen.',
        'Choose a **Background** and a **Layout**: **List** or **Timetable**.',
        'Turn **Show rooms** on or off.',
        'Tap **Save to Photos**.',
        'Open the image in Photos or Gallery and choose **Set as wallpaper**.',
      ] },
      { p: 'The clock and buttons in the preview only help you check the fit. They are not saved in the image.' },
      { h2: 'Share your schedule' },
      { p: 'Tap **Share schedule**, then **Share Image** for the picture or **Share as Text** for a plain list your friends can paste anywhere.' },
      { h2: 'Widgets' },
      { p: 'Open **Settings ▸ Home & Lock Screen** to preview how widgets look with your schedule: **Up next**, **Today**, **Tomorrow**, and **This week**.' },
      { callout: 'note', title: 'Live widgets are coming', body: 'Live home screen widgets arrive in a future update. Until then, a schedule wallpaper keeps your week on the Lock Screen.' },
    ],
    next: ['schedule', 'permissions'],
  },

  // ─── Account & data ────────────────────────────────────────────────────
  {
    slug: 'account',
    title: 'Account & sign-in',
    group: 'Account & data',
    description: 'Create an account with email or Google, confirm your email, sign in, and sign out.',
    body: [
      { p: 'Dormosaur needs an account so your schedule, tasks, and meals are saved and come back if you reinstall.' },
      { h2: 'Create an account' },
      { steps: [
        'Tap **Let’s get started!**.',
        'Enter your name, email, and a password of at least 8 characters. Or tap **Continue with Google**.',
        'If you used email, open the confirmation email and tap the link. Then log in.',
      ] },
      { callout: 'tip', title: 'Confirmation email not arriving?', body: 'Check your spam folder. If it still does not come, use **Continue with Google** instead.' },
      { h2: 'Sign out' },
      { p: 'Open **Settings** and tap **Sign out**, then confirm. Your data stays with your account for the next time you log in.' },
      { h2: 'Forgot your password or want your account deleted?' },
      { p: 'These are handled by support for now. See [Contact support](/docs/contact).' },
    ],
    next: ['settings', 'privacy'],
  },
  {
    slug: 'settings',
    title: 'Settings',
    group: 'Account & data',
    description: 'Change your profile and appearance, and reach alarms, the scanner, wallpaper, and widgets.',
    body: [
      { p: 'Open **Settings** from your avatar on Today.' },
      { h2: 'Profile' },
      { p: 'Edit your **Name**, **School**, and **Dorm**, then tap **Save changes**. Your stats, like **Tasks done**, show at the top.' },
      { h2: 'Appearance' },
      { p: 'Choose **System**, **Light**, or **Dark**. **System** follows your phone’s theme.' },
      { h2: 'Shortcuts' },
      { list: ['**Schedule scanner**: [import a schedule](/docs/import).', '**Class alarms**: [change alarm times](/docs/alarms).', '**Home & Lock Screen** and **Schedule wallpaper**: [wallpaper and widgets](/docs/wallpaper-widgets).'] },
    ],
    next: ['account'],
  },
  {
    slug: 'permissions',
    title: 'Permissions',
    group: 'Account & data',
    description: 'Why Dormosaur asks for each Android permission, and what still works if you decline.',
    body: [
      { p: 'Dormosaur asks for a permission only when you use the feature that needs it.' },
      { h2: 'What each permission is for' },
      { list: [
        '**Notifications**: class alarms. Without it, alarms cannot ring. Everything else still works.',
        '**Camera**: taking a photo of a printed schedule or syllabus. You can choose a screenshot or file instead.',
        '**Photos**: choosing a screenshot to scan, and saving your schedule wallpaper.',
      ] },
      { h2: 'Change a permission' },
      { p: 'Open Android **Settings ▸ Apps ▸ Dormosaur ▸ Permissions** and turn it on or off.' },
    ],
    next: ['privacy'],
  },
  {
    slug: 'privacy',
    title: 'Privacy & data',
    group: 'Account & data',
    description: 'What Dormosaur stores, what it sends when you scan, and what it never does.',
    body: [
      { p: 'Dormosaur is private by design and has zero ads.' },
      { h2: 'What is stored' },
      { p: 'Your profile, classes, alarms, tasks, meal plan, and grocery list are saved to your account so they sync after a reinstall. Your data is tied to your account and protected so only you can read it.' },
      { h2: 'What is sent when you scan' },
      { p: 'When you scan a schedule or syllabus, the image, PDF, or text you chose is sent securely to read the classes or due dates. It is used only for that read.' },
      { h2: 'What we never do' },
      { list: ['We never sell your data.', 'We never show your data to advertisers. There are no ads at all.'] },
      { p: 'Questions about your data? See [Contact support](/docs/contact).' },
    ],
    next: ['permissions', 'account'],
  },

  // ─── Help ──────────────────────────────────────────────────────────────
  {
    slug: 'faq',
    title: 'FAQ',
    group: 'Help',
    description: 'Quick answers about price, scanning, alarms, offline use, and devices.',
    body: [
      { h2: 'Is Dormosaur free?' },
      { p: 'Yes. Dormosaur is free to download and has zero ads.' },
      { h2: 'Why is it an APK and not on the Play Store?' },
      { p: 'We ship the Android app directly while we prepare store listings. See [Install the APK](/docs/install).' },
      { h2: 'Can I import my schedule from a photo?' },
      { p: 'Yes. Use a screenshot, a photo, a PDF, or pasted text, then review every class before saving. See [Import your schedule](/docs/import).' },
      { h2: 'Does it work offline?' },
      { p: 'Class alarms ring with no signal. Scanning, Ask Dormo, and saving changes need a connection.' },
      { h2: 'Can I change how early alarms ring?' },
      { p: 'Yes. Each class can ring 15, 30, or 60 minutes before it starts. See [Class alarms](/docs/alarms).' },
      { h2: 'Does it have home screen widgets?' },
      { p: 'You can save a schedule wallpaper for your Lock Screen today. Live widgets come in a future update.' },
      { h2: 'Is there an iPhone version?' },
      { p: 'iPhone is on the roadmap. For now, Dormosaur is for Android.' },
    ],
    next: ['troubleshooting'],
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    group: 'Help',
    description: 'Fix common problems with installing, scanning, alarms, and signing in.',
    body: [
      { h2: 'The APK will not install' },
      { list: [
        'Allow your browser to **Install unknown apps** when Android asks.',
        'Check that your phone runs Android 8 or later and has free storage space.',
        'Download the APK again. A download that stopped early cannot install.',
      ] },
      { h2: 'The scan found nothing or got classes wrong' },
      { list: [
        'Use the original PDF or a screenshot instead of a photo or copied text.',
        'Make sure the image shows the whole schedule table and is not blurry.',
        'If the PDF is over 3 MB, export only the schedule page.',
        'Fix any remaining class by hand on the review screen.',
      ] },
      { h2: 'Alarms do not ring' },
      { steps: [
        'Check that the alarm switch is on in **Class alarms**.',
        'Allow notifications for Dormosaur in Android settings.',
        'Turn off battery optimisation for Dormosaur: **Settings ▸ Apps ▸ Dormosaur ▸ Battery ▸ Unrestricted**. The exact path differs by phone brand.',
      ] },
      { h2: 'I cannot log in' },
      { list: [
        'If you signed up with email, confirm your email first. Dormo shows **Confirm your email first, then log in.** until you do.',
        'If you signed up with Google, use **Continue with Google** again.',
        'If you forgot your password, [contact support](/docs/contact).',
      ] },
      { h2: 'Ask Dormo does not answer' },
      { p: 'Check your connection and try again in a moment.' },
    ],
    next: ['contact'],
  },
  {
    slug: 'contact',
    title: 'Contact support',
    group: 'Help',
    description: 'Get help with your account, a bug, or a schedule the scanner cannot read.',
    body: [
      { p: 'Most answers are in the [FAQ](/docs/faq) and [Troubleshooting](/docs/troubleshooting). If you are still stuck, write to us.' },
      { contact: true },
      { h2: 'What to include' },
      { list: [
        'The email on your Dormosaur account.',
        'Your phone model and Android version.',
        'What you tried and what happened. A screenshot helps.',
        'For a scan problem, the schedule file if you are comfortable sharing it.',
      ] },
      { h2: 'Account requests' },
      { p: 'Write to us to reset a password you cannot recover, or to delete your account and its data.' },
    ],
  },
]

export const docHref = (slug: string) => (slug ? `/docs/${slug}` : '/docs')
export const getPage = (slug: string) => pages.find(p => p.slug === slug)

/** Reading order follows the sidebar. */
export function neighbours(slug: string) {
  const ordered = GROUPS.flatMap(g => pages.filter(p => p.group === g))
  const i = ordered.findIndex(p => p.slug === slug)
  return { prev: i > 0 ? ordered[i - 1] : undefined, next: i >= 0 ? ordered[i + 1] : undefined }
}

export const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Plain text of a block, for search. */
export function blockText(b: Block): string {
  if ('h2' in b) return b.h2
  if ('p' in b) return b.p
  if ('steps' in b) return b.steps.join(' ')
  if ('list' in b) return b.list.join(' ')
  if ('callout' in b) return `${b.title} ${b.body}`
  return ''
}
