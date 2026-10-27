/*
  Training content. Everything a counsellor sees lives here.

  Module:   { id, title, summary, minutes, lessons: [...], bank: [...] }
  Lesson:   { id, title, intro, video?, image?, steps: [], remember?, warn?, extra?, check }
  Question types:
    single   { q, options: [], answer: index, explain }
    multi    { q, options: [], answer: [indexes], explain }
    order    { q, items: [in the correct order], explain }
    hotspot  { q, img, box: [x1%, y1%, x2%, y2%], explain }
    number   { q, answer, prefix?, explain }

  To add a refresher quiz later, add an entry to GCT_REFRESHERS at the bottom.
*/
(function () {
  const V = (name) => "assets/video/" + name + ".mp4";
  const P = (name) => "assets/video/" + name + ".jpg";
  const I = (name) => "assets/img/" + name;

  const MODULES = [
    /* ------------------------------------------------------------------ */
    {
      id: "exotel",
      title: "Calling with Exotel",
      summary: "Every call goes on a recorded GEMS line. Log in, set up your own number once, and make calls.",
      minutes: 15,
      lessons: [
        {
          id: "why",
          title: "Every call on a recorded line",
          intro: "All admission calls must be made on recorded GEMS lines. Exotel gives you that line.",
          steps: [
            "<b>Lead in the CRM?</b> Use the <b>Call</b> button inside the CRM. It already uses Exotel.",
            "<b>Any other official call</b> (not a CRM lead)? Use the <b>Exotel portal</b> to call.",
            "<b>Never</b> dial a parent from your personal phone's keypad. That call is not recorded."
          ],
          warn: "No recording means no record. Calls are checked for quality and coaching.",
          check: {
            type: "single",
            q: "A parent's enquiry is already in the CRM. How do you call them?",
            options: [
              "Click the Call button inside the CRM",
              "Dial the number on my mobile keypad",
              "Send a WhatsApp voice note"
            ],
            answer: 0,
            explain: "For CRM leads, always click to call from the CRM. It rings on a recorded Exotel line and is logged on the lead."
          }
        },
        {
          id: "verify",
          title: "First time only: verify your phone",
          intro: "Before you log in for the very first time, Exotel must recognise your phone.",
          steps: [
            "Take the phone whose number is registered against your name.",
            "From that phone, call <b>{{EXOTEL_VERIFY_NUMBER}}</b>.",
            "This is done only once. After that you never need to do it again."
          ],
          remember: "Use the same phone number that GEMS corporate office registered for you.",
          check: {
            type: "single",
            q: "Which phone do you use for the first-time verification call?",
            options: [
              "The phone number registered against my name",
              "Any phone in the office",
              "My colleague's phone"
            ],
            answer: 0,
            explain: "Call 080 4863 6969 from the number registered against your name, so Exotel can link it to you."
          }
        },
        {
          id: "login",
          title: "Log in to Exotel",
          intro: "Open the Exotel website and sign in with your GEMS email ID.",
          image: { src: I("exotel-login.jpg"), alt: "Exotel login page", caption: "The Exotel login page. Your GEMS email goes in the first box." },
          steps: [
            "Open <b>my.in.exotel.com</b> in Chrome.",
            "Type your <b>GEMS email ID</b>.",
            "First time? Click <b>Forgot password</b> and set a new password using your GEMS email.",
            "Go back to the login page and sign in with your GEMS email and new password."
          ],
          remember: "Your login is your GEMS email ID, not your personal email.",
          check: {
            type: "single",
            q: "It is your first time on Exotel and you don't have a password. What do you do?",
            options: [
              "Click Forgot password and reset it using my GEMS email",
              "Use a colleague's login",
              "Skip Exotel and call from my phone"
            ],
            answer: 0,
            explain: "First-time users reset their password with Forgot password, using their own GEMS email ID. Never share logins."
          }
        },
        {
          id: "setup",
          title: "One-time setup: choose YOUR number",
          intro: "Before your first call, tell Exotel which GEMS line is yours. This is very important.",
          image: { src: I("exotel-advanced.jpg"), alt: "Exotel Advanced settings showing Through and From", caption: "Click CALL, then Advanced. Fill in Through and From." },
          steps: [
            "Click <b>CALL</b> at the top left.",
            "Click <b>Advanced +</b> on the right of the call box.",
            "In <b>Through</b>, search <b>gems outbound</b> followed by <b>your name</b> and pick it.",
            "In <b>From</b>, select <b>your own Exotel number</b>. This number is given to you by the GEMS corporate office (Dr Jay Vora's team)."
          ],
          warn: "Never pick another person's name or number. Your calls would be recorded against them. If your name is missing, contact the GEMS corporate office before calling.",
          check: {
            type: "hotspot",
            q: "Tap the place you click to open the Through and From settings.",
            img: I("exotel-make-call.jpg"),
            box: [80, 76, 97, 94],
            explain: "Click Advanced + in the call box. Then choose Through (gems outbound + your name) and From (your own number)."
          }
        },
        {
          id: "call",
          title: "Make a call",
          intro: "Calling from the Exotel portal takes four steps.",
          image: { src: I("exotel-make-call.jpg"), alt: "Exotel Make a call box", caption: "Type or paste the number, then click CALL." },
          steps: [
            "Click <b>CALL</b> at the top left of the dashboard.",
            "Copy the parent's phone number.",
            "Paste or type it in the <b>Type a number</b> box.",
            "Click <b>CALL</b> or press <b>Enter</b>.",
            "<b>Your own phone rings first.</b> Answer it.",
            "Exotel now connects you to the parent. Talk as normal."
          ],
          remember: "Your phone rings first. The parent is called only after you pick up.",
          check: {
            type: "order",
            q: "Put the calling steps in the right order.",
            items: [
              "Click CALL at the top left",
              "Type or paste the parent's number",
              "Click CALL or press Enter",
              "Answer when your own phone rings",
              "Talk to the parent"
            ],
            explain: "Open the call box, enter the number, press CALL, answer your own phone, and Exotel connects you."
          }
        },
        {
          id: "after",
          title: "After the call",
          intro: "Exotel saves every call for you. Nothing to do by hand.",
          steps: [
            "When the call ends, the time and duration are saved on Exotel.",
            "The call recording is saved. You can listen to it again.",
            "Managers use recordings for quality checks and coaching."
          ],
          remember: "If the parent is a CRM lead, still add your notes and intent in the CRM after the call.",
          check: {
            type: "single",
            q: "What does Exotel save after each call?",
            options: [
              "Time, duration and the call recording",
              "Nothing, I must write it down",
              "Only the parent's name"
            ],
            answer: 0,
            explain: "Exotel automatically saves call details and the recording."
          }
        }
      ],
      bank: [
        { type: "single", q: "Which calls must go on a recorded GEMS (Exotel) line?", options: ["All official admission calls", "Only calls longer than 5 minutes", "Only calls to new leads"], answer: 0, explain: "Every official call goes on a recorded line." },
        { type: "single", q: "You need to call a parent who is NOT in the CRM (for example a vendor or an old parent). Where do you call from?", options: ["The Exotel portal", "My personal phone keypad", "The CRM Call button"], answer: 0, explain: "Non-CRM official calls are made from the Exotel portal so they are still recorded." },
        { type: "single", q: "What is the Exotel website?", options: ["my.in.exotel.com", "exotel.gemsedu.in", "gemseducation.m.frappe.cloud"], answer: 0, explain: "Log in at my.in.exotel.com." },
        { type: "single", q: "Which email ID do you use to log in to Exotel?", options: ["My GEMS email ID", "My personal Gmail", "The school's general email"], answer: 0, explain: "Always your own GEMS email." },
        { type: "single", q: "Before your very first login, which number do you call for verification?", options: ["080 4863 6969", "The parent's number", "The school reception"], answer: 0, explain: "Call 080 4863 6969 from your registered phone, once." },
        { type: "single", q: "In the one-time setup, what do you search for in the Through box?", options: ["gems outbound + my name", "The parent's name", "Any name in the list"], answer: 0, explain: "Search gems outbound followed by your own name." },
        { type: "single", q: "Who gives you your own Exotel number to select in From?", options: ["GEMS corporate office (Dr Jay Vora's team)", "Exotel customer care", "I choose any free number"], answer: 0, explain: "Your number comes from the GEMS corporate office." },
        { type: "single", q: "Your name does not appear when you search gems outbound. What should you do?", options: ["Contact the GEMS corporate office before calling", "Pick a colleague's name for now", "Call from my personal phone"], answer: 0, explain: "Never use someone else's line. Ask the corporate office to set you up." },
        { type: "single", q: "You click CALL in Exotel. Whose phone rings first?", options: ["My own phone", "The parent's phone", "The school landline"], answer: 0, explain: "Exotel rings you first, then connects the parent." },
        { type: "multi", q: "Select ALL the things Exotel saves after a call.", options: ["Call time", "Call duration", "Call recording", "The parent's fee details"], answer: [0, 1, 2], explain: "Time, duration and recording are saved. Fees live in the CRM." },
        { type: "single", q: "How often do you do the Through / From setup?", options: ["Once, before the first call", "Before every call", "Every Monday"], answer: 0, explain: "It is a one-time setup, but it must be done correctly." },
        { type: "order", q: "Put the first-day steps in order.", items: ["Call 080 4863 6969 from my registered phone", "Log in at my.in.exotel.com with my GEMS email", "Click CALL, then Advanced", "Pick gems outbound + my name, and my own number", "Make my first call"], explain: "Verify, log in, set up once, then call." },
        { type: "hotspot", q: "Tap the box where you type the parent's number.", img: I("exotel-make-call.jpg"), box: [36, 58, 65, 74], explain: "Type or paste the number in the Type a number / name box." },
        { type: "single", q: "Why must you never dial a parent from your phone's keypad?", options: ["The call is not recorded or logged", "It costs more", "Parents cannot hear well"], answer: 0, explain: "Keypad calls are not recorded, so there is no record of the conversation." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "crm-basics",
      title: "Your CRM home",
      summary: "Where leads come from, your enquiry list, and what is inside an enquiry.",
      minutes: 10,
      lessons: [
        {
          id: "open",
          title: "Open the CRM",
          intro: "The CRM is where every family's story is kept, from first call to enrolment.",
          steps: [
            "Open <b>gemseducation.m.frappe.cloud/crm</b> in Chrome.",
            "Log in with your <b>GEMS email ID</b>.",
            "Keep it open all day while you work."
          ],
          remember: "Golden rule: if it is not in the CRM, it did not happen.",
          check: { type: "single", q: "A parent tells you something important on the phone. Where must it be written?", options: ["In the CRM, on that lead", "In my notebook", "In a WhatsApp group"], answer: 0, explain: "If it is not in the CRM, it did not happen." }
        },
        {
          id: "arrive",
          title: "How leads arrive",
          intro: "You do not type in most leads. They arrive by themselves.",
          extra: "stages",
          steps: [
            "Leads from <b>Meta, Google, the website, WhatsApp, billboards and events</b> come straight into the CRM.",
            "Every new lead starts with the status <b>New</b>.",
            "It stays an <b>Enquiry</b> until you start the application. Then it becomes an <b>Application</b>."
          ],
          remember: "New lead in your list = nobody has spoken to the family yet. Call them quickly.",
          check: { type: "single", q: "A Facebook lead has just come in. What is its status?", options: ["New", "Contacted", "Visit Done"], answer: 0, explain: "Every lead arrives as New." }
        },
        {
          id: "list",
          title: "Your enquiry list",
          intro: "Watch: the list of families assigned to you, and the saved views.",
          video: "e1-your-list",
          steps: [
            "Click <b>Enquiries</b> on the left to see families assigned to you.",
            "Use the <b>Public Views</b> on the left, like <b>Not yet contacted</b>.",
            "Start each day by clearing <b>Not yet contacted</b> and <b>No next contact set</b>."
          ],
          check: { type: "single", q: "Which saved view shows families nobody has spoken to yet?", options: ["Not yet contacted", "Enrolled", "Visit done"], answer: 0, explain: "Not yet contacted is your first list each morning." }
        },
        {
          id: "inside",
          title: "Inside an enquiry",
          intro: "Watch: what you see when you open one family.",
          video: "e2-inside-enquiry",
          image: { src: I("crm-lead-header.jpg"), alt: "An enquiry page in the CRM", caption: "Tabs across the top. Buttons on the top right. Details and the call icon on the right." },
          steps: [
            "The record is named after the <b>child</b>. The <b>parent</b> is who you call.",
            "Tabs on top: <b>Activity, Emails, Comments, Data, Calls, Tasks, Notes</b>.",
            "Top right: <b>Book a visit</b>, the <b>status</b> button, and <b>Start Application</b>.",
            "Right side: the <b>phone</b> and <b>email</b> icons, and the family's details."
          ],
          check: { type: "hotspot", q: "Tap the button that shows and changes the lead's status.", img: I("crm-lead-top.jpg"), box: [79, 3, 87, 17], explain: "The status button (here showing New) is at the top right, next to Start Application." }
        }
      ],
      bank: [
        { type: "single", q: "What is the CRM web address?", options: ["gemseducation.m.frappe.cloud/crm", "my.in.exotel.com", "gemsedu.in/crm"], answer: 0, explain: "The CRM is at gemseducation.m.frappe.cloud/crm." },
        { type: "single", q: "What is the golden rule of the CRM?", options: ["If it is not in the CRM, it did not happen", "Only enter hot leads", "Update the CRM once a week"], answer: 0, explain: "Everything you do with a family is recorded on the lead." },
        { type: "single", q: "Leads from Google, Meta and the website come into the CRM...", options: ["Automatically, as New", "Only when I type them in", "As Contacted"], answer: 0, explain: "They arrive by themselves with status New." },
        { type: "single", q: "When does an Enquiry become an Application?", options: ["When I click Start Application", "When I call the parent", "When the parent opens my email"], answer: 0, explain: "Start Application moves the family from Enquiry to Application." },
        { type: "single", q: "The enquiry record is named after...", options: ["The child", "The parent", "The counsellor"], answer: 0, explain: "It is named after the child. You call the parent." },
        { type: "hotspot", q: "Tap the Data tab.", img: I("crm-lead-top.jpg"), box: [28, 21, 33.5, 34], explain: "Data is one of the tabs across the top." },
        { type: "hotspot", q: "Tap the icon you click to call the parent from the CRM.", img: I("crm-lead-top.jpg"), box: [77.4, 55, 80.4, 71], explain: "The phone icon under the child's name is click to call." },
        { type: "hotspot", q: "Tap the button that turns this enquiry into an application.", img: I("crm-lead-top.jpg"), box: [87.5, 3, 98.5, 17], explain: "Start Application is the dark button at the top right." },
        { type: "single", q: "Which view should you clear first every morning?", options: ["Not yet contacted", "Enrolled", "Repeat enquiries"], answer: 0, explain: "Families nobody has spoken to come first." },
        { type: "order", q: "Put the enquiry stages in order.", items: ["New", "Contacted", "Visit Scheduled", "Visit Done"], explain: "New → Contacted → Visit Scheduled → Visit Done." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "walk-in",
      title: "Walk-in leads",
      summary: "A parent walks into the school. Create the lead with your campus walk-in form.",
      minutes: 8,
      lessons: [
        {
          id: "when",
          title: "When a parent walks in",
          intro: "Every family who walks in must be in the CRM. Use your campus walk-in form.",
          extra: "walkins",
          steps: [
            "Each campus has its <b>own</b> walk-in form link. Find yours below.",
            "Keep it bookmarked on the reception tablet or your computer.",
            "Never use paper or Excel for walk-ins. Use the form, then it is in the CRM at once."
          ],
          warn: "Always use the form for YOUR campus. A wrong campus sends the family to the wrong school team.",
          check: { type: "single", q: "A parent walks in at GMS Vikhroli. Which form do you use?", options: ["The GMS Vikhroli walk-in form", "Any campus's walk-in form", "A paper register"], answer: 0, explain: "Use your own campus's walk-in form so the lead lands with the right team." }
        },
        {
          id: "fill",
          title: "Fill the walk-in form",
          intro: "The form has three short parts. Fields with a red * must be filled.",
          image: { src: I("walkin-form.jpg"), alt: "Walk-in form", caption: "The walk-in form for GMA Kochi. Every campus form looks the same." },
          steps: [
            "<b>The child:</b> child's name*, grade applying for*, academic year, present school.",
            "<b>Parent or guardian:</b> parent's first name*, mobile number*, last name, email.",
            "<b>How you heard about us:</b> write what the parent says.",
            "<b>Attended by:</b> choose <b>your name</b>.",
            "Click <b>Submit enquiry</b>. The lead is now in the CRM."
          ],
          remember: "Check the mobile number twice with the parent. A wrong number makes the lead useless.",
          check: { type: "multi", q: "Which fields MUST be filled (red *)? Select all.", options: ["Child's name", "Grade applying for", "Parent's first name", "Mobile number", "Present school"], answer: [0, 1, 2, 3], explain: "Child's name, grade, parent's first name and mobile are required." }
        },
        {
          id: "next",
          title: "After you submit",
          intro: "The walk-in is now a normal lead. Work it like any other.",
          steps: [
            "Open the new lead in the CRM.",
            "Add a <b>note</b> of what you discussed and set the <b>intent</b> (Hot, Warm or Cold).",
            "If you showed the school, record the visit as done. If not, book a visit."
          ],
          check: { type: "single", q: "After submitting the walk-in form, what should you add on the lead?", options: ["A note and the intent", "Nothing more", "A new walk-in form again"], answer: 0, explain: "Add a note and the intent so the next person knows the family." }
        }
      ],
      bank: [
        { type: "single", q: "A parent walks in without any earlier enquiry. What do you do first?", options: ["Fill my campus walk-in form", "Write it in a register", "Ask them to fill the website form at home"], answer: 0, explain: "Use the campus walk-in form at once." },
        { type: "single", q: "Why does each campus have its own walk-in form?", options: ["So the lead goes to the right school and team", "To make it look nice", "There is no reason"], answer: 0, explain: "The form decides the campus on the lead." },
        { type: "multi", q: "Select ALL required fields on the walk-in form.", options: ["Child's name", "Mobile number", "Parent's first name", "Grade applying for", "Email"], answer: [0, 1, 2, 3], explain: "Email is helpful but not required." },
        { type: "single", q: "In 'Attended by', whose name do you choose?", options: ["My own name", "The principal", "Leave it empty"], answer: 0, explain: "Pick yourself so the CRM knows who met the family." },
        { type: "single", q: "Which button sends the walk-in into the CRM?", options: ["Submit enquiry", "Save draft", "Print"], answer: 0, explain: "Submit enquiry creates the lead." },
        { type: "single", q: "Where should the walk-in form be kept?", options: ["Bookmarked on the reception tablet or computer", "Printed on paper", "On a sticky note"], answer: 0, explain: "Keep the link ready so every walk-in goes in straight away." },
        { type: "single", q: "After a walk-in is created, which two things do you add on the lead?", options: ["A note and the intent", "A discount and a reason", "An admission letter"], answer: 0, explain: "Note the conversation and set Hot, Warm or Cold." },
        { type: "single", q: "Why check the mobile number twice?", options: ["A wrong number makes the lead useless", "It is a legal rule", "To fill time"], answer: 0, explain: "We cannot follow up without the right number." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "calling",
      title: "Calling and logging a lead",
      summary: "Click to call, log the call, add notes, set Hot / Warm / Cold, and move New to Contacted only after a real conversation.",
      minutes: 15,
      lessons: [
        {
          id: "click",
          title: "Click to call",
          intro: "Watch: call a family with one click from the CRM.",
          video: "e3-click-to-call-note-task",
          steps: [
            "Open the lead. Click the <b>phone icon</b> on the right.",
            "Your own phone rings. <b>Pick up</b>. The CRM connects you to the parent.",
            "Write your note <b>during</b> the call, not later.",
            "Set the next action as a <b>task</b> with a date (for example: call back on the 15th)."
          ],
          remember: "Don't dial the number yourself. Only click-to-call is recorded and logged on the lead.",
          check: { type: "hotspot", q: "Tap the icon to call this parent.", img: I("crm-lead-top.jpg"), box: [77.4, 55, 80.4, 71], explain: "The phone icon under the name starts click to call." }
        },
        {
          id: "log",
          title: "Log the call and add notes",
          intro: "Watch: after every call, record what happened.",
          video: "e4-log-call-intent",
          steps: [
            "Open the <b>Calls</b> tab. Your call is there with its duration.",
            "Add a <b>note</b>: what the parent wants, grade, concerns (fees, transport), best time to call.",
            "If the call was not logged by itself, click <b>Log a Call</b> and fill type, number, status and duration.",
            "Choose the <b>Outcome</b>: what the call achieved (for example, Spoke to parent, Did not pick up)."
          ],
          remember: "A good note means nobody asks the parent the same questions twice.",
          check: { type: "multi", q: "What should a good call note have? Select all.", options: ["What the parent wants", "Grade and campus", "Concerns like fees or transport", "Best time to call", "My lunch plans"], answer: [0, 1, 2, 3], explain: "Everything useful for the next call, nothing else." }
        },
        {
          id: "intent",
          title: "Set the intent: Hot, Warm or Cold",
          intro: "After every real conversation, edit the lead and set the intent. This is very, very important.",
          image: { src: I("hotspot-intent.jpg"), alt: "Intent field in the Progress section", caption: "Intent sits in the Progress section on the right side of the lead." },
          steps: [
            "<b>Hot</b>: keen and ready. Wants to visit or apply soon.",
            "<b>Warm</b>: interested but still deciding. Needs a follow-up.",
            "<b>Cold</b>: low interest, or looking for a much later date.",
            "Set it in <b>Progress → Intent</b> on the right, or in the call log pop-up."
          ],
          warn: "Every conversation must end with an intent. Reports and follow-up lists depend on it.",
          check: { type: "single", q: "The parent says: \"We loved the website. Can we visit this Saturday?\" What intent?", options: ["Hot", "Warm", "Cold"], answer: 0, explain: "Keen and ready to visit soon: Hot." }
        },
        {
          id: "status",
          title: "New → Contacted (only after a real talk)",
          intro: "You change the status by hand. Do it only when a conversation really happened.",
          image: { src: I("crm-status-menu.jpg"), alt: "Status menu", caption: "Click the status button at the top right to change it." },
          steps: [
            "<b>You spoke to the parent</b> → change status from <b>New</b> to <b>Contacted</b>.",
            "<b>No answer, busy, switched off, wrong time</b> → status <b>stays New</b>. Log the call and set a follow-up task.",
            "To change it: click the <b>status button</b> at the top right and choose the new status."
          ],
          warn: "Never mark Contacted just because you dialled. Contacted means you actually talked.",
          check: { type: "single", q: "You called twice. The parent did not pick up. What is the status?", options: ["It stays New", "Contacted", "Lost"], answer: 0, explain: "No conversation, no change. It stays New, and you set a follow-up." }
        },
        {
          id: "email",
          title: "Send an email from the CRM",
          intro: "Watch: write to the family from inside the CRM.",
          video: "e5-email",
          steps: [
            "Click the <b>email icon</b> on the lead, or open the <b>Emails</b> tab.",
            "The parent's address is already filled in. Check it.",
            "Pick a <b>school template</b>. The campus and parent's name fill in by themselves.",
            "Click <b>Send</b>. The email is saved on the lead."
          ],
          remember: "Use templates, not your own wording. Words like \"Hurry!! Limited seats!!\" send emails to spam.",
          check: { type: "single", q: "Why use the school email templates?", options: ["Correct wording, and names fill in by themselves", "They are longer", "They are not saved"], answer: 0, explain: "Templates keep wording right and stay out of spam." }
        }
      ],
      bank: [
        { type: "single", q: "You spoke to the mother for 5 minutes about Grade 3. What is the status now?", options: ["Contacted", "New", "Visit Done"], answer: 0, explain: "A real conversation happened: New → Contacted." },
        { type: "single", q: "The phone was switched off. What is the status?", options: ["Stays New", "Contacted", "Junk"], answer: 0, explain: "No conversation, so it stays New." },
        { type: "single", q: "The parent answered but said \"I'm driving, call me tomorrow\" and hung up. Is that a conversation?", options: ["No. It stays New and I set a call-back task for tomorrow", "Yes. Mark Contacted", "Mark Lost"], answer: 0, explain: "No real conversation about admission yet. Keep New and create a task for tomorrow." },
        { type: "single", q: "Parent: \"We are interested, but we are also checking two other schools.\" Intent?", options: ["Warm", "Hot", "Cold"], answer: 0, explain: "Interested but deciding: Warm." },
        { type: "single", q: "Parent: \"Maybe in two years. Not now.\" Intent?", options: ["Cold", "Hot", "Warm"], answer: 0, explain: "Low interest for now: Cold." },
        { type: "single", q: "Parent: \"Please send the fee and book a visit this week.\" Intent?", options: ["Hot", "Warm", "Cold"], answer: 0, explain: "Ready to visit soon: Hot." },
        { type: "single", q: "When do you set the intent?", options: ["After every real conversation", "Only at enrolment", "Never, the CRM does it"], answer: 0, explain: "Each conversation ends with an updated intent." },
        { type: "hotspot", q: "Tap where you set the Intent.", img: I("hotspot-intent.jpg"), box: [66, 47.5, 92, 53.5], explain: "Progress → Intent on the right side." },
        { type: "single", q: "When should you write the call note?", options: ["During the call", "At the end of the week", "Only if the call was long"], answer: 0, explain: "Write it while you talk, so nothing is forgotten." },
        { type: "single", q: "The parent asks you to call back on the 15th. What do you create?", options: ["A task with the 15th as due date", "A comment", "A new lead"], answer: 0, explain: "A task with a date reminds you on the day." },
        { type: "single", q: "Where does the email go when you send it from the CRM?", options: ["To the parent, and a copy is saved on the lead", "Only to my inbox", "Nowhere, it is a draft"], answer: 0, explain: "Sent to the parent and kept in the Emails tab." },
        { type: "single", q: "Which wording is SAFE for parent emails?", options: ["Thank you for speaking with us today.", "HURRY!!! LAST SEATS!!!", "Limited offer, act now!!"], answer: 0, explain: "Plain, personal wording avoids spam." },
        { type: "order", q: "Put the after-call steps in order.", items: ["Talk to the parent on click to call", "Add the note", "Set the intent (Hot / Warm / Cold)", "Change New to Contacted", "Create the follow-up task"], explain: "Call, note, intent, status, next action." },
        { type: "multi", q: "Which of these mean the status stays New? Select all.", options: ["No answer", "Number busy", "Phone switched off", "Spoke about fees for 3 minutes"], answer: [0, 1, 2], explain: "Only a real conversation moves it to Contacted." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "visits",
      title: "Visits and handover to school",
      summary: "Book the visit, hand the family to the school team (central team), and mark the visit done.",
      minutes: 12,
      lessons: [
        {
          id: "book",
          title: "Schedule the visit",
          intro: "Watch: book the family's campus visit, then close it off after they come.",
          video: "e6-visit",
          steps: [
            "After a good conversation, click <b>Book a visit</b> (or choose status <b>Visit Scheduled</b>).",
            "A pop-up opens. Pick the <b>date and time</b>, who will meet them, and add a short note.",
            "Click <b>Save visit</b>. The status moves to <b>Visit Scheduled</b> by itself."
          ],
          remember: "Closing the pop-up without saving books nothing. Always click Save visit.",
          check: { type: "single", q: "You chose Visit Scheduled and a pop-up opened. What must you do?", options: ["Enter date and time, then Save visit", "Close the pop-up", "Refresh the page"], answer: 0, explain: "The visit is only booked when you save the date and time." }
        },
        {
          id: "handover",
          title: "Central team: hand over to the school",
          intro: "Only for the central team. Once the visit is booked, the school team takes over.",
          steps: [
            "Booking the visit passes the family to the school team of that campus.",
            "If the <b>Hand to school</b> button still shows on the lead, click it, check the campus, and click <b>Hand over</b>.",
            "Write a short note for the school team: what was discussed and the visit time.",
            "The central counsellor stays on the lead, but the school team now leads."
          ],
          warn: "Check the campus before handing over. The wrong campus sends the family to the wrong school.",
          check: { type: "single", q: "Who hands a lead over to the school team?", options: ["The central team", "The school team", "The parent"], answer: 0, explain: "Handover is a central team step." }
        },
        {
          id: "school",
          title: "School team: confirm and mark Visit Done",
          intro: "The school team receives the enquiry, confirms with the parent, and records the visit.",
          steps: [
            "Open the handed-over enquiry. Read the notes and listen to the call if needed.",
            "Call the parent with <b>click to call</b> and <b>confirm the visit</b>. Log the call.",
            "When the family arrives: click <b>Visit → Visit attended</b> (or status <b>Visit Done</b>).",
            "Choose <b>how the visit went</b> (Very interested, Interested, Undecided, Not interested) and save.",
            "Did not come? Choose <b>No show</b>. Want another day? Choose <b>Move visit</b>."
          ],
          remember: "Attendance and interest are two different answers. Record both.",
          check: { type: "single", q: "The family came for the visit and loved the school. What do you record?", options: ["Visit attended with outcome Very interested", "No show", "Lost"], answer: 0, explain: "Mark the visit attended, then pick how it went." }
        }
      ],
      bank: [
        { type: "single", q: "What status does a lead get when you save a visit date?", options: ["Visit Scheduled", "Visit Done", "Contacted"], answer: 0, explain: "Saving the visit moves it to Visit Scheduled." },
        { type: "single", q: "Which team hands the lead over to the school?", options: ["Central team", "School team", "Finance team"], answer: 0, explain: "Handover is only for the central team." },
        { type: "single", q: "What should the handover note include?", options: ["What was discussed and the visit date and time", "Nothing", "The parent's bank details"], answer: 0, explain: "Give the school team the context and the visit time." },
        { type: "single", q: "School counsellor: the lead was just handed to you. What is the first thing you do?", options: ["Call the parent to confirm the visit, and log the call", "Mark Visit Done", "Mark Lost"], answer: 0, explain: "Confirm the visit with the parent first." },
        { type: "single", q: "The family did not turn up. What do you choose?", options: ["No show", "Visit attended", "Junk"], answer: 0, explain: "No show puts them in the No show, to rebook list." },
        { type: "single", q: "The parent asks to come next week instead. What do you choose?", options: ["Move visit", "No show", "Lost"], answer: 0, explain: "Move visit changes the date." },
        { type: "multi", q: "Which are options for 'How the visit went'? Select all.", options: ["Very interested", "Interested", "Undecided", "Not interested", "Enrolled"], answer: [0, 1, 2, 3], explain: "Enrolled is an application status, not a visit outcome." },
        { type: "single", q: "When the family attends, the status becomes...", options: ["Visit Done", "Visit Scheduled", "New"], answer: 0, explain: "Visit attended → Visit Done." },
        { type: "order", q: "Put the visit journey in order.", items: ["Central team books the visit", "Lead is handed to the school team", "School team confirms the visit with the parent", "Family visits the campus", "School team marks Visit Done with the outcome"], explain: "Book, hand over, confirm, visit, record." },
        { type: "single", q: "You chose Visit Scheduled but closed the pop-up without saving. Is the visit booked?", options: ["No", "Yes", "Only for today"], answer: 0, explain: "Nothing is booked until you click Save visit." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "junk-lost",
      title: "Junk and Lost",
      summary: "Two different endings. Always pick the right one and the right reason in the pop-up.",
      minutes: 8,
      lessons: [
        {
          id: "difference",
          title: "Junk or Lost?",
          intro: "Watch: two different endings for an enquiry.",
          video: "e7-junk-lost",
          image: { src: I("crm-status-menu.jpg"), alt: "Status menu with Lost and Junk", caption: "Lost and Junk are at the bottom of the status menu." },
          steps: [
            "<b>Junk</b> = it was never a real admission enquiry. Wrong number, spam, test, job seeker, duplicate.",
            "<b>Lost</b> = a real family who decided not to go ahead. Chose another school, fee too high, too far, moving city.",
            "Junk does not count against your campus. Lost does, and its reason is studied by marketing and the campus."
          ],
          check: { type: "single", q: "The number belongs to someone looking for a teaching job. Junk or Lost?", options: ["Junk", "Lost"], answer: 0, explain: "Never a real admission enquiry: Junk." }
        },
        {
          id: "popup",
          title: "The reason pop-up",
          intro: "When you choose Lost or Junk, a pop-up asks why. Choose carefully.",
          steps: [
            "Click the <b>status button</b> → choose <b>Lost</b> or <b>Junk</b>.",
            "A pop-up opens. Pick the <b>reason</b> that is really true.",
            "Add a short <b>note</b> in your own words (for example: \"chose a school 2 km from home\").",
            "Click <b>Save</b>."
          ],
          warn: "Never guess a reason. If you don't know why, call the parent and ask before closing the lead.",
          extra: "reasons",
          check: { type: "single", q: "The family visited and then joined another school near their home. What do you choose?", options: ["Lost, reason: Chose another school", "Junk, reason: Wrong number", "Leave it as Visit Done"], answer: 0, explain: "A real family who chose elsewhere: Lost, with the true reason." }
        }
      ],
      bank: [
        { type: "single", q: "The phone number is wrong and belongs to someone else. Junk or Lost?", options: ["Junk", "Lost"], answer: 0, explain: "Not a real enquiry: Junk." },
        { type: "single", q: "Parent says the fee is too high and they will not join. Junk or Lost?", options: ["Lost", "Junk"], answer: 0, explain: "A real family who said no: Lost, reason Fee too high." },
        { type: "single", q: "A test lead someone made by mistake. Junk or Lost?", options: ["Junk", "Lost"], answer: 0, explain: "Test or duplicate data is Junk." },
        { type: "single", q: "The family is moving to another city. Junk or Lost?", options: ["Lost", "Junk"], answer: 0, explain: "Real family, not going ahead: Lost, reason Relocating out of city." },
        { type: "single", q: "What appears when you choose Lost or Junk?", options: ["A pop-up asking for the reason", "Nothing", "The lead is deleted"], answer: 0, explain: "You must pick a reason in the pop-up." },
        { type: "single", q: "You don't know why the family dropped out. What do you do?", options: ["Call the parent and ask before closing", "Pick any reason", "Pick 'Not recorded'"], answer: 0, explain: "Never guess. Reasons drive marketing and campus decisions." },
        { type: "single", q: "Which one counts against your campus?", options: ["Lost", "Junk"], answer: 0, explain: "Junk stops counting. Lost is a real family we did not convert." },
        { type: "multi", q: "Which of these are JUNK? Select all.", options: ["Wrong number", "Spam message", "Duplicate of an existing lead", "Chose another school"], answer: [0, 1, 2], explain: "Chose another school is Lost." },
        { type: "multi", q: "Which of these are LOST? Select all.", options: ["Fee too high", "Distance / transport not viable", "Deferred to next academic year", "Testing lead"], answer: [0, 1, 2], explain: "A testing lead is Junk." },
        { type: "hotspot", q: "Tap the status you choose for a spam lead.", img: I("crm-status-menu.jpg"), box: [66, 32.5, 80, 37.5], explain: "Spam is Junk, the last item in the menu." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "application",
      title: "Application to enrolment",
      summary: "Start the application, record the application fee, verify documents, blocking fee, and mark Enrolled.",
      minutes: 20,
      lessons: [
        {
          id: "start",
          title: "Start the application",
          intro: "Watch: the family is ready. The enquiry becomes an application.",
          video: "e8-start-application",
          steps: [
            "Open the enquiry. Click <b>Start Application</b> at the top right.",
            "Choose the starting status (usually <b>Application Submitted</b>) and confirm.",
            "The lead moves from <b>Enquiry</b> to <b>Application</b>. All calls and notes come with it."
          ],
          remember: "One family, one live record. Don't create a second lead for the same child.",
          check: { type: "hotspot", q: "Tap the button that starts the application.", img: I("crm-lead-top.jpg"), box: [87.5, 3, 98.5, 17], explain: "Start Application, top right." }
        },
        {
          id: "pipeline",
          title: "Your applications list",
          intro: "Watch: every family who has started an application.",
          video: "a1-pipeline",
          extra: "appstages",
          steps: [
            "Click <b>Applications</b> on the left.",
            "Work the views <b>Awaiting application fee</b>, <b>Documents outstanding</b> and <b>Offers outstanding</b> every day.",
            "Each stage must be earned. The CRM will stop you if something is missing."
          ],
          check: { type: "single", q: "Which list shows families who were offered a seat but have not taken it?", options: ["Offers outstanding", "Enrolled", "Not yet contacted"], answer: 0, explain: "Offers expire, so work Offers outstanding daily." }
        },
        {
          id: "appfee",
          title: "Application fee submitted",
          intro: "Watch: the parent has paid the application fee. Record the exact amount.",
          video: "a2-application-fee",
          steps: [
            "Click the <b>status</b> at the top right → choose <b>Application Fee Paid</b>.",
            "A pop-up opens: <b>Record the application fee</b>.",
            "Enter the <b>exact amount</b> the parent actually paid (the net amount), the <b>date</b>, and the <b>receipt / transaction number</b>.",
            "Click <b>Save payment</b>. The stage moves by itself."
          ],
          warn: "The amount must be exactly what GEMS received. Revenue reports read this number.",
          check: { type: "single", q: "The pop-up shows ₹2,000, but the parent paid ₹1,500 after an approved waiver. What do you enter?", options: ["₹1,500, the amount actually received", "₹2,000, as shown", "Leave it empty"], answer: 0, explain: "Always the exact amount received. Then record the ₹500 discount in the Data tab with its reason." }
        },
        {
          id: "docs",
          title: "Document verification",
          intro: "Watch: tick each document as the school receives it.",
          video: "a3-documents",
          steps: [
            "Open the <b>Data</b> tab → <b>Documents</b>.",
            "There are 9 documents. <b>7 are compulsory</b>: birth certificate, student Aadhaar, photos, report card, transfer certificate, address proof, parents' photo ID.",
            "Tick <b>Received</b> only when the school actually holds the document.",
            "When all compulsory documents are ticked, the status can move to <b>Documents Submitted</b>."
          ],
          remember: "If you try to move the stage early, the CRM refuses and tells you what is missing.",
          check: { type: "single", q: "When do you tick a document as Received?", options: ["Only when the school actually has it", "When the parent promises to send it", "Before the visit"], answer: 0, explain: "Tick it only when the school holds the document." }
        },
        {
          id: "offer",
          title: "Admission letter",
          intro: "Watch: once documents are in, the seat can be offered.",
          video: "a4-offer-letter",
          steps: [
            "Only the <b>campus head</b> can release the admission letter.",
            "Ask the head, and keep the family warm while you wait.",
            "Once released, the letter is created by itself, with who released it and when it expires."
          ],
          check: { type: "single", q: "Who releases the admission letter?", options: ["The campus head", "Any counsellor", "The parent"], answer: 0, explain: "Only a campus head can release the offer." }
        },
        {
          id: "blocking",
          title: "Blocking fee",
          intro: "Watch: the family says yes and pays to hold the seat.",
          video: "a5-blocking-fee",
          steps: [
            "Click the <b>status</b> → choose <b>Blocking Fee Paid</b>.",
            "In the pop-up, enter the <b>exact amount received</b>, the <b>date</b> and the <b>reference number</b>.",
            "Click <b>Save payment</b>. The seat is now held."
          ],
          warn: "If you agreed a lower blocking fee, ALSO enter the discount and its reason in the Data tab (next module).",
          check: { type: "single", q: "Which status do you choose when the family pays to hold the seat?", options: ["Blocking Fee Paid", "Enrolled", "Application Fee Paid"], answer: 0, explain: "Blocking Fee Paid, then record the amount in the pop-up." }
        },
        {
          id: "enrolled",
          title: "Enrolled",
          intro: "Watch: the admission fee arrives and the child becomes a student.",
          video: "a6-enrolled",
          steps: [
            "When the admission fee (first tuition instalment) is received, record it and mark the status <b>Enrolled</b>.",
            "Record only the <b>first</b> instalment here. Later instalments are handled in MyClassBoard.",
            "Enrolled is the number every campus is judged on. Make sure it is right."
          ],
          check: { type: "single", q: "When do you mark a family Enrolled?", options: ["When the admission fee is received", "After the first call", "After the visit"], answer: 0, explain: "Enrolled comes after the admission fee is received." }
        },
        {
          id: "endings",
          title: "When there is no seat",
          intro: "Watch: three ways an application can end without enrolment.",
          video: "a7-endings",
          steps: [
            "<b>Waitlisted</b>: no seat yet, still in play.",
            "<b>Rejected</b>: the school said no.",
            "<b>Withdrawn</b>: the family said no.",
            "Always record the <b>reason</b>."
          ],
          check: { type: "single", q: "The family decides not to join after getting the offer. Which status?", options: ["Withdrawn", "Rejected", "Waitlisted"], answer: 0, explain: "The family said no: Withdrawn." }
        }
      ],
      bank: [
        { type: "single", q: "What happens when you click Start Application?", options: ["The lead moves from Enquiry to Application", "The lead is deleted", "An email is sent to finance"], answer: 0, explain: "It becomes an application, with all history." },
        { type: "single", q: "You choose Application Fee Paid. What appears?", options: ["A pop-up to record the fee", "Nothing", "The Lost reason box"], answer: 0, explain: "The pop-up asks for amount, date and reference." },
        { type: "multi", q: "What do you enter in the fee pop-up? Select all.", options: ["Exact amount received", "Date paid", "Receipt / transaction number", "Parent's Aadhaar number"], answer: [0, 1, 2], explain: "Amount, date and reference." },
        { type: "single", q: "Which amount goes into the fee pop-up?", options: ["The exact net amount the parent paid", "The published fee always", "A rounded estimate"], answer: 0, explain: "Exactly what GEMS received." },
        { type: "single", q: "How many documents are compulsory?", options: ["7", "9", "3"], answer: 0, explain: "9 documents, 7 compulsory." },
        { type: "multi", q: "Which documents are compulsory? Select all.", options: ["Birth certificate", "Transfer certificate", "Report card from the present school", "Immunisation record"], answer: [0, 1, 2], explain: "Immunisation and caste certificate are optional." },
        { type: "single", q: "You try to move to Documents Submitted, but two compulsory documents are missing. What happens?", options: ["The CRM refuses and says what is missing", "It moves anyway", "The lead is lost"], answer: 0, explain: "Each stage must be earned." },
        { type: "single", q: "Who can release the admission letter?", options: ["Campus head", "Central counsellor", "Any school counsellor"], answer: 0, explain: "Only a campus head." },
        { type: "order", q: "Put the application stages in order.", items: ["Application Submitted", "Application Fee Paid", "Documents Submitted", "Admission Letter Released", "Blocking Fee Paid", "Enrolled"], explain: "This is the order every application follows." },
        { type: "single", q: "The school has no seat right now but may later. Which status?", options: ["Waitlisted", "Rejected", "Withdrawn"], answer: 0, explain: "Waitlisted: no seat yet, still in play." },
        { type: "single", q: "The school decided not to admit the child. Which status?", options: ["Rejected", "Withdrawn", "Lost"], answer: 0, explain: "The school said no: Rejected." },
        { type: "single", q: "Which tuition instalment is recorded in the CRM?", options: ["Only the first", "All of them", "None"], answer: 0, explain: "Only the first. Later ones belong to MyClassBoard." },
        { type: "single", q: "After recording a lower blocking fee in the pop-up, what else must you do?", options: ["Enter the discount and reason in the Data tab", "Nothing", "Mark Enrolled"], answer: 0, explain: "Dual verification: the discount and its reason go in the Data tab too." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "financials",
      title: "Fees and discounts (Data tab)",
      summary: "Enter the exact fee, discount and reason in the Data tab. This feeds every revenue report and must be 100% right.",
      minutes: 15,
      lessons: [
        {
          id: "why",
          title: "Why this must be 100% right",
          intro: "Every revenue report reads the numbers you type. Nobody checks them after you.",
          steps: [
            "When you update the status (for example Application Fee Paid), a pop-up asks for the <b>exact fee received</b>. That is the net amount.",
            "Then, open the <b>Data</b> tab and enter the <b>exact discount amount</b> you gave, with the <b>reason</b>.",
            "This is a <b>double check</b>: the pop-up and the Data tab must tell the same story."
          ],
          warn: "Wrong numbers here mean wrong revenue reports for the whole of GEMS. Be 100% accurate.",
          check: { type: "single", q: "Why enter the discount in the Data tab after the fee pop-up?", options: ["It is a double check, and reports read both", "It is optional", "Only to help finance"], answer: 0, explain: "The pop-up amount and the Data tab discount must match." }
        },
        {
          id: "tuition",
          title: "Give a tuition discount",
          intro: "Watch: a sibling discount of 10% on tuition.",
          video: "f1-tuition-discount",
          steps: [
            "Open the application → <b>Data</b> tab → <b>What they owe</b>.",
            "Find the <b>Tuition</b> row.",
            "Type the percent in <b>Off %</b>, or the rupees in <b>Discount</b>. The other fills itself in.",
            "Pick the <b>Reason</b> (for example Sibling). It saves when the reason is chosen.",
            "Check the <b>Net</b> and <b>Total collectable</b> changed."
          ],
          check: { type: "hotspot", q: "Tap where you choose the discount Reason for the Tuition row.", img: I("crm-fee-grid-crop.jpg"), box: [69.5, 53, 82, 61], explain: "The Reason column, on the same row as the discount." }
        },
        {
          id: "blocking",
          title: "Discount on the blocking fee",
          intro: "Watch: the part people get wrong.",
          video: "f2-blocking-discount",
          steps: [
            "In the <b>Blocking fee</b> row, type the discount (for example ₹5,000 off ₹25,000).",
            "<b>Pick the reason.</b> Without a reason <b>nothing is saved</b>, and nothing warns you.",
            "If you agreed an amount, type it in <b>Discount</b> (₹). The percent fills itself in."
          ],
          warn: "A discount without a reason disappears when you leave the page. Always pick the reason, then check the Net.",
          check: { type: "single", q: "You typed a ₹5,000 discount but did not pick a reason, then left the page. What happened?", options: ["Nothing was saved", "It saved anyway", "Finance will fix it"], answer: 0, explain: "No reason, no save. Always pick the reason." }
        },
        {
          id: "extras",
          title: "Extras and the total",
          intro: "Watch: things the family takes or doesn't take, like the school bus.",
          video: "f3-extras-total",
          steps: [
            "The <b>Take</b> tick adds or removes a charge (for example Transport).",
            "Tick <b>Transport</b> only if the family wants the bus.",
            "<b>Total collectable</b> at the bottom is what the family owes. Check it before you tell the parent."
          ],
          check: { type: "single", q: "The family does NOT want the school bus. What do you do with the Transport row?", options: ["Leave Take unticked", "Tick Take", "Give a 100% discount"], answer: 0, explain: "Untick Take for things the family is not taking." }
        },
        {
          id: "practice",
          title: "Practice: work out the numbers",
          intro: "Try it yourself. Use a calculator if you like.",
          steps: [
            "Published tuition: <b>₹2,14,000</b>. Sibling discount: <b>10%</b>.",
            "Discount = 2,14,000 × 10 ÷ 100 = <b>₹21,400</b>.",
            "Net tuition = 2,14,000 − 21,400 = <b>₹1,92,600</b>."
          ],
          remember: "Discount = fee × percent ÷ 100. Net = fee − discount.",
          check: { type: "number", q: "Blocking fee is ₹25,000. You agreed the family pays ₹20,000. What discount amount (₹) do you enter?", answer: 5000, prefix: "₹", explain: "25,000 − 20,000 = ₹5,000. Enter 5000 in Discount and pick the reason." }
        }
      ],
      bank: [
        { type: "single", q: "Where do you enter the discount and its reason?", options: ["Data tab → What they owe → Fees", "Comments tab", "Exotel portal"], answer: 0, explain: "The fee grid in the Data tab." },
        { type: "single", q: "What happens to a discount entered WITHOUT a reason?", options: ["It is not saved", "It saves anyway", "It is doubled"], answer: 0, explain: "Always pick the reason." },
        { type: "number", q: "Tuition is ₹1,80,000. Merit scholarship is 10%. What is the discount in ₹?", answer: 18000, prefix: "₹", explain: "1,80,000 × 10 ÷ 100 = ₹18,000." },
        { type: "number", q: "Tuition is ₹2,00,000 and the discount is ₹30,000. What is the net tuition in ₹?", answer: 170000, prefix: "₹", explain: "2,00,000 − 30,000 = ₹1,70,000." },
        { type: "number", q: "Application fee is ₹2,000. The family paid ₹1,000. What discount (₹) goes in the Data tab?", answer: 1000, prefix: "₹", explain: "2,000 − 1,000 = ₹1,000, with a reason." },
        { type: "single", q: "A parent's other child already studies at GEMS. Which discount reason?", options: ["Sibling", "Staff ward", "Merit scholarship"], answer: 0, explain: "A brother or sister at GEMS: Sibling." },
        { type: "single", q: "The parent is a GEMS employee. Which reason?", options: ["Staff ward", "Corporate", "Alumni family"], answer: 0, explain: "Child of a GEMS employee: Staff ward." },
        { type: "single", q: "The parent studied at a GEMS school. Which reason?", options: ["Alumni family", "Sibling", "Armed forces"], answer: 0, explain: "Former GEMS student parent: Alumni family." },
        { type: "single", q: "Who uses these fee numbers?", options: ["All GEMS revenue reports", "Only me", "Nobody"], answer: 0, explain: "Every revenue report reads them." },
        { type: "single", q: "The family wants the school bus. What do you do?", options: ["Tick Take on the Transport row", "Add it in comments", "Nothing"], answer: 0, explain: "Tick Take so it joins Total collectable." },
        { type: "single", q: "Which number tells you what the family owes in total?", options: ["Total collectable", "Published", "Off %"], answer: 0, explain: "Total collectable is the full amount owed." },
        { type: "single", q: "You type 10 in Off %. What happens to the Discount (₹)?", options: ["It fills itself in", "It stays 0", "It must be typed again"], answer: 0, explain: "Percent and rupees fill each other in." },
        { type: "order", q: "Put the fee steps in order after the parent pays the application fee with a discount.", items: ["Change status to Application Fee Paid", "Enter the exact amount received in the pop-up and save", "Open the Data tab", "Enter the discount on the Application fee row", "Pick the reason and check the Net"], explain: "Pop-up first, then the Data tab discount and reason as the double check." },
        { type: "hotspot", q: "Tap the Off % box of the Tuition row.", img: I("crm-fee-grid-crop.jpg"), box: [49.5, 53, 57.8, 61], explain: "Off % is just left of Discount." }
      ]
    }
  ];

  /* Refreshers: short quizzes counsellors can retake any time.
     pool: module ids to draw from ("all" = every module). size: questions per attempt.
     questions: extra hand-written questions just for this refresher (optional). */
  const REFRESHERS = [
    { id: "daily-5", title: "Daily 5", summary: "Five random questions from the whole training. Take it every morning.", pool: "all", size: 5 },
    { id: "status-intent", title: "Status and intent drill", summary: "New or Contacted? Hot, Warm or Cold? Junk or Lost?", pool: ["calling", "junk-lost"], size: 8 },
    { id: "money", title: "Money drill", summary: "Fee pop-ups, discounts and reasons. Must be 100% right.", pool: ["financials", "application"], size: 8 }
  ];

  const STAGES = {
    enquiry: ["New", "Contacted", "Visit Scheduled", "Visit Done"],
    application: ["Application Submitted", "Application Fee Paid", "Documents Submitted", "Admission Letter Released", "Blocking Fee Paid", "Enrolled"]
  };

  const REASONS = {
    junk: ["Wrong Number", "Duplicate or invalid enquiry", "Looking for a job", "Not looking for admission", "Testing", "International number"],
    lost: ["Chose another school", "Fee too high", "Distance / transport not viable", "Deferred to next academic year", "Relocating out of city", "No seat in requested grade", "Grade not available", "Unreachable"]
  };

  window.GCT_CONTENT = { MODULES, REFRESHERS, STAGES, REASONS };
})();
