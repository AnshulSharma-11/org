import { DATA } from './dataAnswers';
import { DEFAULT_LEAVE_QUOTA } from '../config/appConfig';

/* ═══════════════════════════════════════════════════════════
   ORGPLUS assistant — knowledge base
   Every answer below describes screens and fields that exist in
   the app. Reply shape:
     { text, facts?:[[label,value]], links?:[{label,to}], chips?:[] }
   roles : '*' or any of 'guest' | 'employee' | 'hr'
   ═══════════════════════════════════════════════════════════ */

const hour = () => new Date().getHours();
const salute = () => (hour() < 12 ? 'Good morning' : hour() < 17 ? 'Good afternoon' : 'Good evening');
const E = (c, p = '') => `/employee/${c.employeeId}${p}`;

/* ───────── page directory (used for "take me to …") ───────── */
export function pagesFor(c) {
  if (c.role === 'hr') {
    return [
      { names: ['dashboard', 'home'], to: '/admin', label: 'Dashboard' },
      { names: ['employees', 'employee list', 'staff list'], to: '/admin/employees', label: 'Employees' },
      { names: ['add employee', 'new employee'], to: '/admin/employees/add', label: 'Add Employee' },
      { names: ['departments', 'department list'], to: '/admin/departments', label: 'Departments' },
      { names: ['add department', 'new department'], to: '/admin/departments/add', label: 'Add Department' },
      { names: ['branches', 'branch list'], to: '/admin/branches', label: 'Branches' },
      { names: ['add branch', 'new branch'], to: '/admin/branches/add', label: 'Add Branch' },
      { names: ['designations', 'designation list'], to: '/admin/designations', label: 'Designations' },
      { names: ['add designation', 'new designation'], to: '/admin/designations/add', label: 'Add Designation' },
      { names: ['attendance', 'time records', 'attendance records'], to: '/admin/time-records', label: 'Attendance' },
      { names: ['leave', 'leaves', 'leave requests'], to: '/admin/leaves', label: 'Leave' },
      { names: ['add leave', 'new leave'], to: '/admin/leaves/add', label: 'Add Leave' },
      { names: ['payroll', 'salary', 'payslips'], to: '/admin/payroll', label: 'Payroll' },
      { names: ['run payroll', 'new payroll', 'add payroll'], to: '/admin/payroll/add', label: 'Run Payroll' },
      { names: ['performance', 'performance reviews', 'reviews'], to: '/admin/performance', label: 'Performance' },
      { names: ['add review', 'new review', 'add performance review'], to: '/admin/performance/add', label: 'Add Performance Review' },
      { names: ['help desk', 'help', 'tickets', 'help requests'], to: '/admin/help', label: 'Help Desk' },
      { names: ['projects', 'project list'], to: '/admin/projects', label: 'Projects' },
      { names: ['add project', 'new project'], to: '/admin/projects/add', label: 'Add Project' },
      { names: ['reports', 'analytics', 'charts', 'graphs'], to: '/admin/reports', label: 'Reports' },
    ];
  }
  if (c.role === 'employee') {
    return [
      { names: ['dashboard', 'home'], to: E(c), label: 'Dashboard' },
      { names: ['profile', 'my profile'], to: E(c, '/profile'), label: 'My Profile' },
      { names: ['projects', 'my projects'], to: E(c, '/projects'), label: 'My Projects' },
      { names: ['documents', 'my documents'], to: E(c, '/documents'), label: 'My Documents' },
      { names: ['leave', 'leaves', 'my leaves'], to: E(c, '/leaves'), label: 'My Leaves' },
      { names: ['apply leave', 'leave application', 'new leave'], to: E(c, '/leaves/apply'), label: 'Apply for Leave' },
      { names: ['help', 'raise request', 'support', 'help request'], to: E(c, '/help/raise'), label: 'Raise a Help Request' },
      { names: ['payroll', 'payslip', 'salary'], to: E(c, '/payroll'), label: 'Payroll' },
      { names: ['attendance'], to: E(c, '/attendance'), label: 'Attendance' },
      { names: ['reports', 'my reports', 'charts', 'graphs'], to: E(c, '/reports'), label: 'My Reports' },
    ];
  }
  return [
    { names: ['home', 'home page'], to: '/', label: 'Home' },
    { names: ['hr login', 'hr panel', 'admin login'], to: '/admin/login', label: 'HR Panel Login' },
    { names: ['employee login', 'employee panel'], to: '/employee/login', label: 'Employee Panel Login' },
  ];
}

/* ───────── suggestion chips ───────── */
export function starters(c) {
  const p = c.pathname || '';
  if (c.role === 'hr') {
    if (p.includes('/leaves')) return ['Pending leave requests', 'How do I approve a leave?', 'Who is on leave today?'];
    if (p.includes('/payroll')) return ['How do I run payroll?', 'Payroll status this month', 'What goes in the payslip JSON?'];
    if (p.includes('/help')) return ['Open help requests', 'How do I handle a help request?'];
    if (p.includes('/employees')) return ['How do I add an employee?', 'How many employees do we have?', 'Birthdays this month'];
    if (p.includes('/reports')) return ['What reports are available?', 'Can I print a report?', 'Daily briefing'];
    return ['Daily briefing', 'Pending leave requests', 'Who is present today?', 'How do I run payroll?'];
  }
  if (c.role === 'employee') {
    if (p.includes('/leaves')) return ['My leave balance', 'How do I apply for leave?', 'Why was my leave rejected?'];
    if (p.includes('/payroll')) return ['My latest payslip', 'Was my salary paid?'];
    if (p.includes('/attendance')) return ['My attendance this month', 'My attendance is wrong'];
    if (p.includes('/documents')) return ['How do I upload a document?', 'Which file types are allowed?'];
    return ['My leave balance', 'How do I apply for leave?', 'My latest payslip', 'My attendance this month'];
  }
  return ['What is ORGPLUS?', 'What features are there?', 'How do I log in?', 'HR panel vs Employee panel'];
}

const moreChips = (c) => starters(c).slice(0, 3);

/* ───────── intents ───────── */
export const INTENTS = [
  /* ═════════ small talk ═════════ */
  {
    id: 'greet', roles: '*',
    phrases: ['hello', 'hello there', 'good morning', 'good afternoon', 'good evening', 'hi there', 'hello assistant'],
    run: (c) => ({
      text: `${salute()}${c.first ? `, ${c.first}` : ''}! How can I help you today?`,
      chips: starters(c),
    }),
  },
  {
    id: 'thanks', roles: '*',
    phrases: ['thanks', 'thank you', 'thanks a lot', 'thank you so much', 'great thanks', 'appreciate it'],
    run: () => ({ text: "You're welcome! Let me know if there's anything else." }),
  },
  {
    id: 'bye', roles: '*',
    phrases: ['bye', 'goodbye', 'see you later', 'good night', 'talk to you later'],
    run: () => ({ text: 'Goodbye! I\'m always here in the corner if you need me.' }),
  },
  {
    id: 'how_are_you', roles: '*',
    phrases: ['how is it going', 'how do you do', 'how are things'],
    run: (c) => ({ text: "I'm doing well, thanks for asking! What can I help you with?", chips: moreChips(c) }),
  },
  {
    id: 'who_are_you', roles: '*',
    phrases: ['who are you', 'what are you', 'are you a bot', 'are you ai', 'are you human', 'are you chatgpt', 'what is your name',
      'introduce yourself', 'are you a real person', 'are you a chatbot', 'are you a robot', 'is this a bot'],
    run: (c) => ({
      text: "I'm the **ORGPLUS Assistant**, a built-in helper that lives inside this website.\n\n"
        + "- I explain ORGPLUS features and walk you through tasks step by step.\n"
        + (c.role === 'guest' ? '' : "- I can look up your live data (leave balance, payslips, attendance, and more) using your own login.\n")
        + "- I'm not a general-purpose AI, so for anything outside ORGPLUS your HR team is the right contact.",
      chips: moreChips(c),
    }),
  },
  {
    id: 'unlimited_usage', roles: '*',
    phrases: ['is there a limit', 'unlimited usage', 'is this free', 'does it cost anything', 'how many questions can i ask',
      'usage limit', 'message limit', 'is the assistant free', 'is the chatbot free to use', 'is there a limit on questions',
      'is there a limit on how many questions i can ask', 'is there any usage limit', 'do i need to pay to use this', 'does this cost money', 'any charges for using this'],
    run: () => ({
      text: "No limits at all. The assistant runs right inside the website, so there's no message quota and no per-question charge. Ask as much as you like, whenever you like.",
    }),
  },
  {
    id: 'capabilities', roles: '*',
    phrases: ['what can you do', 'how can you help me', 'what can i ask you', 'what do you know', 'show me what you can do',
      'what questions can i ask', 'how can you assist'],
    run: (c) => {
      if (c.role === 'hr') {
        return {
          text: 'As your HR assistant I can:\n\n'
            + '- **Brief you** on what needs attention today: pending leaves, open tickets, attendance, payroll, overdue projects\n'
            + '- **Look things up**: headcount, who is on leave, birthdays, anniversaries, new hires, or a specific employee\n'
            + '- **Walk you through tasks**: adding employees, approving leave, running payroll, performance reviews, projects, help desk\n'
            + '- **Open any page** for you: just say "take me to payroll"',
          chips: starters(c),
        };
      }
      if (c.role === 'employee') {
        return {
          text: 'As your assistant I can:\n\n'
            + '- **Check your live data**: leave balance, leave status, attendance, latest payslip, projects, help requests\n'
            + '- **Guide you** through applying for leave, uploading documents, raising a help request\n'
            + '- **Open any page** for you: just say "take me to my payslips"',
          chips: starters(c),
        };
      }
      return {
        text: 'I can tell you what ORGPLUS offers, explain the HR and Employee panels, and help you log in. Once you sign in, I can also look up your live data and guide you through tasks.',
        chips: starters(c),
      };
    },
  },

  /* ═════════ about ORGPLUS ═════════ */
  {
    id: 'features_overview', roles: '*',
    phrases: ['what is orgplus', 'what is orgpluse', 'what features does orgplus have', 'what can orgplus do', 'list all features',
      'tell me about this website', 'what is this website', 'about orgplus', 'what modules are there', 'what is this app',
      'what does this system do', 'what is this software', 'what features are there', 'overview of features'],
    run: (c) => ({
      text: '**ORGPLUS** is an employee management system that keeps your HR work in one place:\n\n'
        + '- **Employees**: profiles, departments, branches, designations and reporting managers\n'
        + '- **Attendance**: daily check-in / check-out and working hours\n'
        + '- **Leave**: apply, approve or reject, with leave types and a yearly balance\n'
        + '- **Payroll**: payslips per employee, payment status and online salary payment via Razorpay\n'
        + '- **Performance**: review cycles, criteria ratings and overall ratings\n'
        + '- **Projects**: create projects and assign teams\n'
        + '- **Help Desk**: employees raise requests, HR assigns and resolves them\n'
        + '- **Documents**: employees upload and manage their own files\n'
        + '- **Reports**: charts for the whole organisation (HR) and for each person (employee)\n'
        + '- **Dark / light mode** and a layout that works on phones',
      chips: c.role === 'guest' ? ['HR panel vs Employee panel', 'How do I log in?'] : moreChips(c),
    }),
  },
  {
    id: 'panels_explained', roles: '*',
    phrases: ['difference between hr panel and employee panel', 'what is the hr panel', 'what is the employee panel', 'who can use this',
      'roles in orgplus', 'which panel should i use', 'hr panel vs employee panel', 'hr versus employee', 'what is the difference between panels',
      'who is hr panel for'],
    run: (c) => ({
      text: 'ORGPLUS has two separate areas:\n\n'
        + '- **HR Panel**: for the HR team. Manage employees, departments, branches and designations; approve leave; record attendance; run payroll; handle performance reviews, projects and the help desk; view organisation-wide reports.\n'
        + '- **Employee Portal**: for every employee. See your profile, attendance, leave balance and payslips; apply for leave; upload documents; raise help requests; view your own reports.\n\n'
        + 'Employees only ever see their own information.',
      links: c.role === 'guest' ? [{ label: 'HR Panel Login', to: '/admin/login' }, { label: 'Employee Login', to: '/employee/login' }] : undefined,
    }),
  },
  {
    id: 'login_help', roles: '*',
    phrases: ['how do i log in', 'login', 'sign in', 'cant login', 'unable to login', 'how to access my account', 'login problem',
      'login failed', 'wrong password', 'where to login', 'how to get access', 'i cannot sign in', 'invalid credentials', 'who gives me an account'],
    run: (c) => ({
      text: c.role === 'guest'
        ? 'Use the buttons on the home page:\n\n'
          + '- **Employee Panel Login**: sign in with the email and password your HR team set up for you.\n'
          + '- **HR Panel Login**: sign in with your HR account email and password.\n\n'
          + "Employee accounts are created by HR, so if you can't sign in, ask your HR team to confirm your email and password. Check that Caps Lock is off."
        : "You're already signed in. If you ever see \"invalid credentials\", double-check the email and password. Employees can ask HR to confirm them.",
      links: c.role === 'guest' ? [{ label: 'HR Panel Login', to: '/admin/login' }, { label: 'Employee Login', to: '/employee/login' }] : undefined,
    }),
  },
  {
    id: 'register_help', roles: ['guest', 'hr'],
    phrases: ['how to create hr account', 'register hr', 'sign up', 'create an account', 'new hr account', 'how do i register',
      'create admin account', 'i dont have an account'],
    run: (c) => ({
      text: '- **HR accounts**: open the HR Panel Login page and use the **Register here** link under the Sign In button. You need your full name, email and a password of at least 6 characters.\n'
        + '- **Employee accounts**: these are created by HR from **Employees → Add Employee**. Employees cannot sign themselves up.',
      links: c.role === 'guest' ? [{ label: 'HR Panel Login', to: '/admin/login' }] : [{ label: 'Add Employee', to: '/admin/employees/add' }],
    }),
  },
  {
    id: 'forgot_password', roles: '*',
    phrases: ['forgot password', 'reset my password', 'change my password', 'lost my password', 'password not working', 'how to reset password',
      'i forgot my password'],
    run: (c) => ({
      text: "ORGPLUS doesn't have a self-service password reset yet.\n\n"
        + (c.role === 'hr'
          ? '- Ask whoever administers the system to help you recover access.'
          : '- **Employees**: ask your HR team to help you with a new password.\n- **HR users**: contact the person who manages the ORGPLUS system.'),
    }),
  },
  {
    id: 'theme_toggle', roles: '*',
    phrases: ['dark mode', 'light mode', 'change theme', 'switch theme', 'night mode', 'how to enable dark mode', 'turn on dark theme',
      'change appearance', 'how do i change the colour scheme'],
    run: () => ({
      text: 'Tap the **sun / moon button** to switch themes:\n\n'
        + '- Home and login pages: top-right corner\n'
        + '- HR panel: bottom of the sidebar (or top bar on a phone)\n'
        + '- Employee portal: top navigation bar\n\n'
        + 'Your choice is remembered on this device.',
    }),
  },
  {
    id: 'mobile_help', roles: '*',
    phrases: ['use on phone', 'is it mobile friendly', 'menu not showing on phone', 'open on mobile', 'how to use on my phone',
      'where is the menu on mobile', 'sidebar missing on phone', 'does it work on tablet'],
    run: (c) => ({
      text: 'ORGPLUS works on phones and tablets.\n\n'
        + '- **HR panel**: tap the **☰** button at the top-left to open the menu.\n'
        + '- **Employee portal**: tap the **☰** button at the top-right.\n'
        + '- Tables scroll sideways inside their card, and charts resize to fit.',
      chips: moreChips(c),
    }),
  },
  {
    id: 'privacy', roles: '*',
    phrases: ['is my data safe', 'who can see my data', 'privacy', 'data security', 'who sees my information', 'is it secure',
      'can others see my salary', 'who can view my payslip', 'can hr see my documents', 'who can access my documents',
      'can other employees view my files', 'is my information confidential'],
    run: (c) => ({
      text: 'Access in ORGPLUS is role-based:\n\n'
        + '- **Employees** can only see their own profile, attendance, leave, payslips, documents and requests.\n'
        + '- **HR users** can see organisation-wide information.\n\n'
        + (c.role === 'guest' ? '' : 'This assistant works with the same permissions as your login, so it can only look up what you are already allowed to see. The questions you type stay in this browser session.'),
    }),
  },
  {
    id: 'logout_help', roles: ['employee', 'hr'],
    phrases: ['how to log out', 'sign out', 'logout', 'exit my account', 'where is the logout button'],
    run: (c) => ({
      text: c.role === 'hr'
        ? 'Use **Logout** at the bottom of the sidebar (on a phone, open the ☰ menu first).'
        : 'Use **Logout** at the right end of the top bar (on a phone, open the ☰ menu first).',
    }),
  },
  {
    id: 'contact_human', roles: '*',
    phrases: ['talk to hr', 'contact hr', 'speak to a person', 'human agent', 'contact support', 'i need to talk to someone',
      'who can i contact', 'speak to someone', 'customer care'],
    run: (c) => {
      if (c.role === 'employee') return { text: 'The best way to reach HR is a **help request**. It is tracked, assigned to someone and answered inside ORGPLUS.', links: [{ label: 'Raise a Help Request', to: E(c, '/help/raise') }] };
      if (c.role === 'hr') return { text: 'Employee requests arrive in the **Help Desk**, where you can assign and resolve them. For problems with the ORGPLUS system itself, contact whoever administers it for your organisation.', links: [{ label: 'Open Help Desk', to: '/admin/help' }] };
      return { text: 'For account or access problems please contact your organisation\'s HR team. Once you are signed in, you can also raise a help request from the Employee Portal.' };
    },
  },
  {
    id: 'something_broken', roles: '*',
    phrases: ['page not loading', 'the website is broken', 'i see an error', 'website is slow', 'data is not showing', 'blank page',
      'it is not working', 'bug', 'failed to load'],
    run: (c) => ({
      text: 'Sorry about that. A few quick things to try:\n\n'
        + '- Refresh the page and sign in again if asked.\n'
        + '- Check your internet connection.\n'
        + '- Some screens need the server to be reachable, so wait a minute and retry.\n\n'
        + (c.role === 'employee' ? 'If it keeps happening, raise a **Technical Support** help request.' : c.role === 'hr' ? 'If it persists, contact your system administrator.' : ''),
      links: c.role === 'employee' ? [{ label: 'Raise a Help Request', to: E(c, '/help/raise') }] : undefined,
    }),
  },
  {
    id: 'reports_info', roles: ['employee', 'hr'],
    phrases: ['what reports are available', 'where are the reports', 'show analytics', 'graphs and charts', 'insights', 'statistics',
      'where can i see graphs', 'reports and analytics', 'what charts are there', 'show me my reports'],
    pages: ['reports'],
    run: (c) => (c.role === 'hr' ? {
      text: '**Reports & Analytics** has seven tabs, each with charts:\n\n'
        + '- **Overview**: key numbers, headcount growth, hires vs exits, attendance rate\n'
        + '- **Workforce**: departments, branches, gender, age, tenure\n'
        + '- **Attendance**: trends, hours, weekday pattern, check-in times\n'
        + '- **Leave**: days by month, types, top leave takers\n'
        + '- **Payroll**: payslips by status, net pay trends\n'
        + '- **Performance & Projects**: ratings, deadlines, workload\n'
        + '- **Help Desk**: raised vs resolved, resolution time',
      links: [{ label: 'Open Reports', to: '/admin/reports' }],
    } : {
      text: '**My Reports** shows your own activity:\n\n'
        + '- An attendance calendar of every working day\n'
        + '- Attendance rate, hours worked and check-in times\n'
        + '- Leave balance and leave history\n'
        + '- Pay trends from your payslips\n'
        + '- Projects, deadlines and help requests',
      links: [{ label: 'Open My Reports', to: E(c, '/reports') }],
    }),
  },
  {
    id: 'print_report', roles: ['employee', 'hr'],
    phrases: ['print report', 'download report as pdf', 'export report', 'save report as pdf', 'can i print the reports', 'how to export charts',
      'download my report'],
    run: (c) => ({
      text: 'On the Reports page, click **Print / PDF** (top-right). It lays out every tab on one document in light colours. In the print dialog choose **Save as PDF** to keep a copy.',
      links: [{ label: 'Open Reports', to: c.role === 'hr' ? '/admin/reports' : E(c, '/reports') }],
    }),
  },

  /* ═════════ EMPLOYEE · how-to ═════════ */
  {
    id: 'emp_apply_leave', roles: ['employee'], pages: ['/leaves'],
    phrases: ['how do i apply for leave', 'apply leave', 'request leave', 'submit leave application', 'take a day off', 'book time off',
      'how do i ask for leave', 'i want to apply for leave', 'leave application steps', 'apply for sick leave', 'i want to take a holiday next week',
      'i would like to go on vacation in december', 'i plan to go on holiday next month', 'i need a day off tomorrow'],
    run: (c) => ({
      text: 'To apply for leave:\n\n'
        + '1. Open **My Leaves → Apply** (or the *Apply Leave* card on your dashboard).\n'
        + '2. Choose the **Leave Type**.\n'
        + '3. Pick the **Start Date** and **End Date**. Total days are calculated automatically.\n'
        + '4. Add an optional **Reason** and press **Submit Application**.\n\n'
        + 'It starts as *Pending* until HR approves or rejects it.',
      links: [{ label: 'Apply for Leave', to: E(c, '/leaves/apply') }, { label: 'My Leaves', to: E(c, '/leaves') }],
      chips: ['What leave types are there?', 'My leave balance'],
    }),
  },
  {
    id: 'emp_leave_types', roles: ['employee'],
    phrases: ['what leave types are there', 'types of leave', 'sick leave', 'casual leave', 'earned leave', 'maternity leave', 'unpaid leave',
      'which leave should i choose', 'leave categories', 'difference between sick and casual leave', 'what kinds of leave can i take',
      'what kind of leaves are available', 'how many types of leave exist'],
    run: (c) => ({
      text: 'You can choose from five leave types when applying:\n\n'
        + '- **Casual**: short personal time off\n'
        + '- **Sick**: illness or medical needs\n'
        + '- **Earned**: leave you have accrued\n'
        + '- **Maternity**: maternity leave\n'
        + '- **Unpaid**: time off without pay\n\n'
        + `Your yearly allowance is **${DEFAULT_LEAVE_QUOTA} days**. Your exact entitlement per type is set by your organisation's policy, so check with HR if unsure.`,
      links: [{ label: 'Apply for Leave', to: E(c, '/leaves/apply') }],
    }),
  },
  {
    id: 'emp_leave_balance', roles: ['employee'], pages: ['/leaves'], data: true,
    phrases: ['my leave balance', 'how many leaves do i have left', 'remaining leaves', 'leave days left', 'how many days off can i take',
      'leaves taken so far', 'leave quota', 'how many leaves have i used', 'available leave balance', 'leave count', 'how much leave do i have', 'how much leave is left',
      'how many days of leave remain', 'do i have any leave left'],
    run: (c) => DATA.empLeaveBalance(c),
  },
  {
    id: 'emp_leave_status', roles: ['employee'], pages: ['/leaves'], data: true,
    phrases: ['status of my leave', 'was my leave approved', 'my leave requests', 'pending leave', 'why was my leave rejected', 'my leave history',
      'rejection reason', 'has hr approved my leave', 'my recent leave applications', 'leave request status'],
    run: (c) => DATA.empLeaveStatus(c),
  },
  {
    id: 'emp_cancel_leave', roles: ['employee'],
    phrases: ['cancel my leave', 'withdraw leave request', 'delete leave application', 'change leave dates', 'edit my leave',
      'i applied for the wrong dates', 'undo leave request', 'modify my leave'],
    run: (c) => ({
      text: "Leave requests can't be edited or cancelled from the Employee Portal once submitted.\n\n"
        + '- Raise a **Leave Issue** help request with the leave dates and what you need changed. HR can update or remove it for you.',
      links: [{ label: 'Raise a Help Request', to: E(c, '/help/raise') }, { label: 'My Leaves', to: E(c, '/leaves') }],
    }),
  },
  {
    id: 'emp_doc_upload', roles: ['employee'], pages: ['/documents'],
    phrases: ['how to upload document', 'upload my documents', 'add a certificate', 'attach a file', 'submit documents',
      'where to upload pan card', 'upload offer letter', 'how do i add my documents', 'upload id proof'],
    run: (c) => ({
      text: 'To upload a document:\n\n'
        + '1. Open **My Documents**.\n'
        + '2. In *Upload New Document*, click the box (or drag a file onto it).\n'
        + '3. Optionally add a **Document Label** such as "Offer Letter" or "PAN Card".\n'
        + '4. Press **Upload Document**.',
      links: [{ label: 'My Documents', to: E(c, '/documents') }],
      chips: ['Which file types are allowed?'],
    }),
  },
  {
    id: 'emp_doc_manage', roles: ['employee'], pages: ['/documents'],
    phrases: ['download my document', 'delete uploaded document', 'what file types are allowed', 'file size limit', 'supported formats',
      'maximum upload size', 'remove a document', 'which file formats are supported', 'what file types can i upload',
      'which file types can be uploaded', 'allowed file formats'],
    run: (c) => ({
      text: 'You can upload **PDF, Word, Excel and image files up to 10 MB** each.\n\n'
        + '- Use the **download** icon on a document to save it.\n'
        + '- Use the **delete** icon to remove one you no longer need.',
      links: [{ label: 'My Documents', to: E(c, '/documents') }],
    }),
  },
  {
    id: 'emp_payslip_howto', roles: ['employee'], pages: ['/payroll'],
    phrases: ['where can i see my payslip', 'view my salary slip', 'download payslip', 'where is my payroll', 'how to check salary',
      'where do i find my payslips', 'open my payroll page'],
    run: (c) => ({
      text: 'Open **Payroll** in the top menu. You will see one card per month showing the **run date**, the **payment status** (Draft, Processed or Paid) and the payslip breakdown.',
      links: [{ label: 'My Payroll', to: E(c, '/payroll') }],
      chips: ['My latest payslip'],
    }),
  },
  {
    id: 'emp_payslip_data', roles: ['employee'], pages: ['/payroll'], data: true,
    phrases: ['my latest payslip', 'last salary', 'my salary this month', 'how much did i get paid', 'net pay', 'was my salary paid',
      'show my payroll status', 'when will i get my salary', 'salary credited', 'my recent payslips'],
    run: (c) => DATA.empPayslip(c),
  },
  {
    id: 'emp_attendance_howto', roles: ['employee'], pages: ['/attendance'],
    phrases: ['where to see my attendance', 'how is attendance recorded', 'view attendance records', 'how to check in', 'how do i mark attendance',
      'attendance filter', 'see attendance for a past month', 'who records my attendance'],
    run: (c) => ({
      text: 'Attendance is recorded by HR, and you can view it under **Attendance**:\n\n'
        + '- Your check-in, check-out, hours worked and status for each day\n'
        + '- Use the **month / year filter** and press **Apply** to look at another period\n'
        + '- Summary tiles for days present, absent and half days',
      links: [{ label: 'My Attendance', to: E(c, '/attendance') }, { label: 'My Reports', to: E(c, '/reports') }],
    }),
  },
  {
    id: 'emp_attendance_fix', roles: ['employee'], pages: ['/attendance'],
    phrases: ['my attendance is wrong', 'incorrect attendance', 'missed check in', 'forgot to check in', 'correct my attendance',
      'absent marked wrongly', 'attendance not updated', 'wrong working hours', 'fix my attendance record',
      'i was marked absent by mistake', 'wrongly marked absent', 'attendance mistake', 'my check in time is incorrect'],
    run: (c) => ({
      text: 'Attendance is edited by HR. To get a record corrected, raise an **Attendance Issue** help request with the date and the correct check-in / check-out times.',
      links: [{ label: 'Raise a Help Request', to: E(c, '/help/raise') }],
    }),
  },
  {
    id: 'emp_attendance_data', roles: ['employee'], pages: ['/attendance'], data: true,
    phrases: ['my attendance this month', 'how many days present', 'my attendance rate', 'how many days was i absent', 'how many hours did i work',
      'my working hours', 'attendance streak', 'my attendance summary', 'my attendance percentage'],
    run: (c) => DATA.empAttendance(c),
  },
  {
    id: 'emp_profile_howto', roles: ['employee'], pages: ['/profile'],
    phrases: ['view my profile', 'where is my profile', 'update my profile', 'change my phone number', 'change my address', 'update personal details',
      'edit my details', 'how to change my email', 'correct my name', 'change my surname', 'my name is spelled wrong', 'update my contact details'],
    run: (c) => ({
      text: 'Your **My Profile** page shows your personal information, employment details and reporting manager.\n\n'
        + "It's read-only. To change something (phone, address, name, department or designation) raise a help request, choosing **General Support**, **Department Change** or **Designation Change**, and HR will update it.",
      links: [{ label: 'My Profile', to: E(c, '/profile') }, { label: 'Raise a Help Request', to: E(c, '/help/raise') }],
    }),
  },
  {
    id: 'emp_profile_data', roles: ['employee'], data: true,
    phrases: ['who is my manager', 'my reporting manager', 'who do i report to', 'my department', 'my designation', 'my branch',
      'when did i join', 'my hire date', 'my employee id', 'my employee code', 'my job title', 'where do i work'],
    run: (c) => DATA.empProfile(c),
  },
  {
    id: 'emp_help_raise', roles: ['employee'], pages: ['/help'],
    phrases: ['raise a help request', 'how to contact hr', 'report a problem', 'submit a ticket', 'create support ticket', 'make a complaint',
      'request department change', 'request designation change', 'how do i ask hr for something', 'new help request',
      'lodge a complaint', 'submit a complaint to hr', 'complaint about my manager', 'i have a grievance to report'],
    run: (c) => ({
      text: 'To raise a help request:\n\n'
        + '1. Open **Help** in the top menu.\n'
        + '2. Choose a **Request Type**: Attendance Issue, Complaint, Department Change, Designation Change, General Support, Leave Issue, Payroll Issue or Technical Support.\n'
        + '3. Set a **Priority** and write a short **Subject** and a clear **Description**.\n'
        + '4. Press **Submit Request**.\n\n'
        + 'For a department change you will also be asked for the department you want to move to.',
      links: [{ label: 'Raise a Help Request', to: E(c, '/help/raise') }],
      chips: ['Status of my help requests'],
    }),
  },
  {
    id: 'emp_help_status', roles: ['employee'], pages: ['/help'], data: true,
    phrases: ['status of my help request', 'my open requests', 'has hr replied', 'my help requests', 'ticket status',
      'did hr respond to my request', 'is my complaint resolved', 'what is happening with my ticket', 'any update on my ticket',
      'progress of my help request', 'my open tickets', 'how many open tickets do i have', 'open help requests of mine'],
    run: (c) => DATA.empHelp(c),
  },
  {
    id: 'emp_projects_data', roles: ['employee'], pages: ['/projects'], data: true,
    phrases: ['my projects', 'what projects am i working on', 'my deadlines', 'upcoming deadlines', 'project due dates',
      'which projects are assigned to me', 'do i have any overdue project'],
    run: (c) => DATA.empProjects(c),
  },
  {
    id: 'emp_dashboard', roles: ['employee'],
    phrases: ['what is on my dashboard', 'dashboard cards', 'quick actions', 'explain my dashboard', 'what do the dashboard numbers mean'],
    run: (c) => ({
      text: 'Your dashboard shows your profile card, four live numbers (**leaves remaining, days present, open tickets, pending leaves**) and quick-action shortcuts to profile, documents, leave, help, payslips, attendance and reports.',
      links: [{ label: 'Dashboard', to: E(c) }],
    }),
  },

  /* ═════════ HR · how-to ═════════ */
  {
    id: 'hr_add_employee', roles: ['hr'], pages: ['/employees'],
    phrases: ['how to add an employee', 'add new employee', 'onboard an employee', 'create employee account', 'register new staff',
      'new joiner setup', 'how do i add a new hire', 'employee onboarding steps'],
    run: () => ({
      text: 'To add an employee:\n\n'
        + '1. Go to **Employees → Add Employee**.\n'
        + '2. Fill in **Employee Code, First / Last Name, Email, Password, Phone**, plus gender, date of birth, hire date and address.\n'
        + '3. Pick the **Department, Designation, Branch** and **Manager**, and set the **Status** (Active / Inactive).\n'
        + '4. Save. The employee can then sign in with that email and password.\n\n'
        + 'Tip: create the department, branch and designation first so they appear in the dropdowns.',
      links: [{ label: 'Add Employee', to: '/admin/employees/add' }, { label: 'Departments', to: '/admin/departments' }],
    }),
  },
  {
    id: 'hr_update_employee', roles: ['hr'], pages: ['/employees'],
    phrases: ['edit employee details', 'update employee information', 'change employee department', 'transfer an employee', 'change designation',
      'promote an employee', 'assign a manager', 'how to change employee status', 'correct employee phone number', 'update employee record'],
    run: () => ({
      text: 'Open **Employees**, find the person (use the search and filter bar), and use the **edit** action on their row. You can change department, designation, branch, manager, status, contact details and more, then save.',
      links: [{ label: 'Employees', to: '/admin/employees' }],
    }),
  },
  {
    id: 'hr_terminate', roles: ['hr'], pages: ['/employees'],
    phrases: ['how to terminate an employee', 'employee resigned', 'mark employee as left', 'deactivate employee', 'offboard an employee',
      'remove an employee', 'delete employee', 'employee exit process', 'how to record a resignation', 'someone is leaving the company', 'an employee is quitting',
      'update the system when an employee leaves', 'employee last working day'],
    run: () => ({
      text: 'Two options on the **Employees** page:\n\n'
        + '- **Recommended**: edit the employee, set **Status** to *Terminated* (or *Inactive*) and enter the **Termination Date**. Their history stays available for reports and attrition tracking.\n'
        + '- **Delete**: removes the record entirely. Use it only for mistakes.',
      links: [{ label: 'Employees', to: '/admin/employees' }],
    }),
  },
  {
    id: 'hr_org_structure', roles: ['hr'], pages: ['/departments', '/branches', '/designations'],
    phrases: ['how to add a department', 'add a branch', 'add designation', 'manage departments', 'create a designation', 'rename a department',
      'delete a branch', 'set up company structure', 'how do i create departments'],
    run: () => ({
      text: 'Departments, branches and designations are managed the same way:\n\n'
        + '1. Open **Departments**, **Branches** or **Designations** in the sidebar.\n'
        + '2. Use the **Add** button to create one, or the row actions to **edit** or **delete**.\n\n'
        + 'Set these up before adding employees so they can be chosen in the Add Employee form.',
      links: [{ label: 'Departments', to: '/admin/departments' }, { label: 'Branches', to: '/admin/branches' }, { label: 'Designations', to: '/admin/designations' }],
    }),
  },
  {
    id: 'hr_approve_leave', roles: ['hr'], pages: ['/leaves'],
    phrases: ['how to approve leave', 'reject a leave request', 'review leave requests', 'approve a leave', 'leave approval steps',
      'how do i accept leave', 'decline leave request', 'where do i approve leaves'],
    run: () => ({
      text: 'To process leave requests:\n\n'
        + '1. Open **Leave** and filter by **Status → Pending** if you like.\n'
        + '2. Press **Approve** to approve instantly.\n'
        + '3. To decline, press **Reject** and enter a **Rejection reason**. The employee will see it under *Rejection Note* in their My Leaves page.',
      links: [{ label: 'Leave', to: '/admin/leaves' }],
      chips: ['Pending leave requests'],
    }),
  },
  {
    id: 'hr_add_leave', roles: ['hr'], pages: ['/leaves'],
    phrases: ['add leave for an employee', 'create leave on behalf', 'record leave manually', 'edit a leave record', 'change leave dates for employee',
      'update an existing leave', 'cancel an employees leave', 'leave correction'],
    run: () => ({
      text: 'HR can manage leave directly:\n\n'
        + '- **Add Leave** (top of the Leave page): pick the employee, type, dates and status.\n'
        + '- Use the row actions to **edit** an existing leave (dates, type, status) or **delete** it.\n\n'
        + 'This is also how you handle an employee\'s request to change or cancel a leave.',
      links: [{ label: 'Add Leave', to: '/admin/leaves/add' }, { label: 'Leave', to: '/admin/leaves' }],
    }),
  },
  {
    id: 'hr_mark_attendance', roles: ['hr'], pages: ['/time-records'],
    phrases: ['how to mark attendance', 'add attendance record', 'record check in', 'correct attendance', 'edit attendance', 'attendance panel',
      'fix an attendance record', 'how do i log attendance for an employee', 'mark someone present'],
    run: () => ({
      text: 'On the **Attendance** page:\n\n'
        + '1. Open the **Mark Attendance** panel.\n'
        + '2. Choose the employee and date, set **Check-in / Check-out** times and the **Status** (Present, Absent, Half Day, On Leave) and add notes if needed.\n'
        + '3. Save. Hours worked are shown in the table.\n\n'
        + 'Wrong entries can be removed with the delete action and re-entered.',
      links: [{ label: 'Attendance', to: '/admin/time-records' }],
    }),
  },
  {
    id: 'hr_run_payroll', roles: ['hr'], pages: ['/payroll'],
    phrases: ['how to run payroll', 'process salary', 'generate payslips', 'create a payroll run', 'pay salary to employees', 'razorpay payment',
      'how to pay employees', 'monthly payroll steps', 'how do i process payroll'],
    run: () => ({
      text: 'To run payroll:\n\n'
        + '1. Open **Payroll → Run Payroll**.\n'
        + '2. Choose the **Month**, **Year** and **Run Date**, and optionally who **processed** it.\n'
        + '3. Optionally paste a **default payslip template** (JSON). It is applied to every employee; leave it blank to create empty payslips.\n'
        + '4. Press **Run Payroll**. This creates **one payslip per active employee**; anyone who already has a payslip for that month is skipped automatically.\n'
        + '5. To pay, use **Pay Salary** on a payroll record. Payment goes through **Razorpay** and the record becomes *Paid*.\n\n'
        + 'Statuses: **Draft → Processed → Paid**.',
      links: [{ label: 'Run Payroll', to: '/admin/payroll/add' }, { label: 'Payroll', to: '/admin/payroll' }],
      chips: ['What goes in the payslip JSON?', 'Payroll status this month'],
    }),
  },
  {
    id: 'hr_payslip_template', roles: ['hr'], pages: ['/payroll'],
    phrases: ['what goes in the payslip json', 'payslip template', 'what fields in the payslip', 'payslip format', 'salary breakdown fields',
      'net pay field name', 'how to show salary charts', 'payslip data format'],
    run: () => ({
      text: 'The payslip is free-form JSON, so you choose the fields. For the **salary charts in Reports** to work, include numeric amounts under names such as:\n\n'
        + '- `basicSalary`\n- `hra`\n- `deductions`\n- `netPay`\n\n'
        + 'Other fields (bank details, allowances, notes) are fine too. They simply show on the payslip.',
      links: [{ label: 'Run Payroll', to: '/admin/payroll/add' }],
    }),
  },
  {
    id: 'hr_performance', roles: ['hr'], pages: ['/performance'],
    phrases: ['how to add a performance review', 'create an appraisal', 'performance review steps', 'rate an employee', 'review cycle',
      'add a rating', 'how do i evaluate an employee', 'start appraisal cycle'],
    run: () => ({
      text: 'To record a review:\n\n'
        + '1. Open **Performance → Add Review**.\n'
        + '2. Pick the **Employee** and **Reviewer**, name the **Cycle** (e.g. "H1 2026") and set the start and end dates.\n'
        + '3. Enter the **Criteria Ratings** and the **Overall Rating**, then choose a status (Pending, In Progress, Completed).\n'
        + '4. Save. You can edit it later from the list.\n\n'
        + 'Ratings feed the Performance charts in Reports.',
      links: [{ label: 'Add Review', to: '/admin/performance/add' }, { label: 'Performance', to: '/admin/performance' }],
    }),
  },
  {
    id: 'hr_projects', roles: ['hr'], pages: ['/projects'],
    phrases: ['how to create a project', 'assign employees to a project', 'add team to project', 'project priority', 'manage projects',
      'how do i assign a project', 'set a project deadline', 'project team members'],
    run: () => ({
      text: 'To set up a project:\n\n'
        + '1. Open **Projects → Add Project**.\n'
        + '2. Enter the **name**, **description**, **priority**, **status** (Planned, In Progress, On Hold, Completed) and **deadline**.\n'
        + '3. Save, then use the **Team** action on the project to **assign employees**. They will see it in their *My Projects* page.',
      links: [{ label: 'Add Project', to: '/admin/projects/add' }, { label: 'Projects', to: '/admin/projects' }],
    }),
  },
  {
    id: 'hr_helpdesk', roles: ['hr'], pages: ['/help'],
    phrases: ['how to handle help requests', 'assign a ticket', 'resolve a ticket', 'close a request', 'respond to employee request',
      'help desk workflow', 'how do i answer an employees ticket', 'manage tickets'],
    run: () => ({
      text: 'On the **Help Desk** page:\n\n'
        + '- Filter by status, type or priority to find what needs attention.\n'
        + '- **Assign** a request to a team member.\n'
        + '- **Mark Resolved** and add **resolution notes** so the employee knows the outcome.\n'
        + '- Use **Update Ticket** to change status (Open, In Progress, Resolved, Closed), priority or assignee.',
      links: [{ label: 'Help Desk', to: '/admin/help' }],
      chips: ['Open help requests'],
    }),
  },
  {
    id: 'hr_filters', roles: ['hr'],
    phrases: ['how to filter employees', 'how do i search records', 'how to sort the list', 'how to reset filters', 'how to find a record in the table',
      'how to use the filter bar'],
    run: () => ({
      text: 'Every list page has a **filter bar** at the top: search box, dropdown filters and sorting. Set your options and press **Apply**; press **Reset** to clear them. You can also ask me to find a person, for example *"find Priya"*.',
    }),
  },

  /* ═════════ HR · live data ═════════ */
  {
    id: 'hr_briefing', roles: ['hr'], data: true,
    phrases: ['daily briefing', 'summary of today', 'give me an overview of the company', 'what needs my attention', 'any updates',
      'what is happening today', 'what needs my attention today', 'anything urgent today', 'what do i need to do today', 'company summary', 'morning briefing', 'what should i do today', 'organisation snapshot'],
    run: (c) => DATA.hrBriefing(c),
  },
  {
    id: 'hr_headcount', roles: ['hr'], data: true,
    phrases: ['how many employees do we have', 'total headcount', 'number of employees', 'active employees count', 'employee count',
      'how many staff', 'how big is the company', 'total employees'],
    run: (c) => DATA.hrHeadcount(c),
  },
  {
    id: 'hr_dept_breakdown', roles: ['hr'], data: true,
    phrases: ['employees by department', 'headcount by department', 'department wise count', 'which department is biggest',
      'how many people in each department', 'department breakdown', 'team sizes', 'employees by branch'],
    run: (c) => DATA.hrDepartments(c),
  },
  {
    id: 'hr_pending_leaves', roles: ['hr'], pages: ['/leaves'], data: true,
    phrases: ['pending leave requests', 'leaves awaiting approval', 'who applied for leave', 'leave requests to approve',
      'how many leave requests are pending', 'which leaves need approval', 'unapproved leaves', 'how many leaves are waiting for approval'],
    run: (c) => DATA.hrPendingLeaves(c),
  },
  {
    id: 'hr_on_leave_today', roles: ['hr'], data: true,
    phrases: ['who is on leave today', 'who is off today', 'employees on leave', 'people on leave now', 'who is away today',
      'which employees are on leave', 'is anyone on leave'],
    run: (c) => DATA.hrOnLeaveToday(c),
  },
  {
    id: 'hr_attendance_today', roles: ['hr'], pages: ['/time-records'], data: true,
    phrases: ['who is present today', 'attendance today', 'todays attendance', 'how many present today', 'who is absent today',
      'who has not checked in', 'how many people came today', 'attendance summary today'],
    run: (c) => DATA.hrAttendanceToday(c),
  },
  {
    id: 'hr_open_tickets', roles: ['hr'], pages: ['/help'], data: true,
    phrases: ['open help requests', 'pending tickets', 'unresolved requests', 'how many tickets are open', 'critical tickets',
      'which help requests need attention', 'help desk backlog', 'open complaints'],
    run: (c) => DATA.hrOpenTickets(c),
  },
  {
    id: 'hr_payroll_status', roles: ['hr'], pages: ['/payroll'], data: true,
    phrases: ['payroll status', 'has payroll been run', 'this months payroll', 'unpaid salaries', 'pending salary payments',
      'who has not been paid', 'payroll progress', 'how many payslips are paid'],
    run: (c) => DATA.hrPayrollStatus(c),
  },
  {
    id: 'hr_overdue_projects', roles: ['hr'], pages: ['/projects'], data: true,
    phrases: ['overdue projects', 'projects past deadline', 'project deadlines', 'upcoming project deadlines', 'which projects are late',
      'projects due soon', 'late projects'],
    run: (c) => DATA.hrProjects(c),
  },
  {
    id: 'hr_birthdays', roles: ['hr'], data: true,
    phrases: ['birthdays this month', 'who has a birthday today', 'upcoming birthdays', 'employee birthdays', 'any birthdays',
      'whose birthday is it'],
    run: (c) => DATA.hrBirthdays(c),
  },
  {
    id: 'hr_anniversaries', roles: ['hr'], data: true,
    phrases: ['work anniversaries', 'anniversaries this month', 'who completed a year', 'service anniversaries', 'work anniversary today',
      'who is celebrating a work anniversary'],
    run: (c) => DATA.hrAnniversaries(c),
  },
  {
    id: 'hr_new_hires', roles: ['hr'], data: true,
    phrases: ['new hires', 'who joined recently', 'recent joiners', 'new employees this month', 'latest joinees', 'who joined this month'],
    run: (c) => DATA.hrNewHires(c),
  },
  {
    id: 'hr_attrition', roles: ['hr'], data: true,
    phrases: ['attrition rate', 'how many left this year', 'employees who resigned', 'turnover rate', 'how many exits', 'who left the company',
      'staff turnover'],
    run: (c) => DATA.hrAttrition(c),
  },
  {
    id: 'hr_find_employee', roles: ['hr'], data: true,
    phrases: ['find employee', 'search for an employee', 'who is employee', 'lookup employee', 'employee details', 'show details of employee',
      'contact details of employee', 'find person', 'where does employee work', 'employee information'],
    run: (c) => DATA.hrFindEmployee(c),
  },
];

export const FALLBACK = (c) => ({
  text: "I'm not sure I understood that. I can help with ORGPLUS features and your data. Here are a few things you can ask:",
  chips: starters(c),
  links: c.role === 'employee' ? [{ label: 'Raise a Help Request', to: E(c, '/help/raise') }] : undefined,
});
