/** Text for the public homepage and privacy page. Kept apart so signed-in screens don't download it. */
export const landing = {
  navLogin: 'Kirish',
  navStart: 'Boshlash',
  heroTag: 'IT mutaxassislari uchun',
  heroTitle: 'Hujjatlarni oʻqiy olasiz. Endi yigʻilishda gapiring.',
  heroText:
    'Ishdan charchagan boʻlsangiz ham, kuniga 5 daqiqa yetadi. Standup, code review va intervyu kabi haqiqiy vaziyatlarda ingliz tilida gapirishni mashq qiling.',
  heroCta: 'Bepul hisob ochish',
  heroSecondary: 'Qanday ishlaydi?',
  orbitWords: ['standup', 'blocker', 'deadline', 'pull request', 'deploy', 'bug fix', 'interview', 'code review'],

  phoneToday: 'Bugungi vaziyat',
  phoneLesson: 'Tell your manager a task is late',
  phoneStart: 'Darsni boshlash',
  phoneCoach: 'Is the payment API ready?',
  phoneYou: 'Not yet. It’s taking longer than expected.',
  floatBefore: 'it is not finish',
  floatAfter: 'it isn’t finished',
  floatStreak: 'Kunlik odat',
  floatSpeak: 'Gapiring',

  stats: [
    { value: '5', label: 'daqiqa kuniga' },
    { value: '30', label: 'ish vaziyati' },
    { value: '111', label: 'foydali ibora' },
    { value: '7', label: 'qisqa video' },
  ],

  problemTitle: 'Muammo vaqtda emas, charchoqda',
  problemText:
    'Uzun kurslar ish kunidan keyin davom etmaydi. Oddiy ilovalar esa “The cat is on the table” oʻrgatadi, sizga esa yigʻilishda “reliz kechikadi” deyish kerak.',
  problems: [
    { title: 'Oʻqiysiz, lekin gapira olmaysiz', text: 'Hujjatlarni tushunasiz, ammo yigʻilishda soʻz topilmaydi.' },
    { title: 'Vaqt va kuch kam', text: 'Bir soatlik darsga kuch qolmaydi. Bu yerda bir daqiqalik variant ham bor.' },
    { title: 'Xato qilishdan xijolat', text: 'Avval bu yerda xato qiling. AI hech kimga aytmaydi.' },
  ],

  howTitle: 'Bir kunlik mashq',
  steps: [
    { title: 'Vaziyatni oling', text: 'Masalan: menejerga vazifa kechikishini ayting. Ishda kerak boʻladigan 3 ta ibora bilan.' },
    { title: 'Ovoz chiqarib gapiring', text: 'AI hamkasb bilan rolli suhbat qiling. Tuzatish va maslahatlar oʻzbek tilida keladi.' },
    { title: 'Unutib qoʻymang', text: 'Iboralar kerakli vaqtda takrorlashga qaytadi, shunda ular xotirada qoladi.' },
  ],

  demoTitle: 'Tuzatish shunday koʻrinadi',
  demoText: 'Misolni tanlang va farqni koʻring.',
  demoSaid: 'Siz aytdingiz',
  demoBetter: 'Shunday aytsa boʻladi',
  demoTip: 'Maslahat',
  demos: [
    {
      label: 'Standup',
      said: 'no it not ready, i have problem with database migration',
      better: 'No, it’s not ready yet. I ran into a problem with the database migration.',
      tip: '“it not ready” emas, “it’s not ready” deng: inglizchada “is” feʼlini tushirib qoldirib boʻlmaydi.',
    },
    {
      label: 'Blocker',
      said: 'yes i am waiting access to server since two days',
      better: 'Yes, I’ve been waiting for access to the server for two days.',
      tip: 'Davomiylik uchun “since” emas, “for” ishlatiladi: “for two days”.',
    },
    {
      label: 'Xabar',
      said: 'i will send you tomorrow the report because i have problem with server',
      better: 'I’ll send you the report tomorrow because I’m having a problem with the server.',
      tip: 'Vaqtni bildiruvchi soʻz odatda gap oxirida keladi: “the report tomorrow”.',
    },
  ],
  demoNote: 'Bular ilovamizdagi AI bergan tuzatishlarga asoslangan namunalar.',

  featuresTitle: 'Mashqni qiziqarli qiladigan narsalar',
  features: [
    { id: 'roleplay', title: 'AI bilan rolli suhbat', text: 'Menejer, mijoz yoki intervyuer bilan gaplashing va darhol tuzatish oling.' },
    { id: 'shadow', title: 'Takrorlab gapirish', text: 'Gapni tinglang va takrorlang. Taniladigan soʻzlar gapirayotganingizda yashil boʻladi.' },
    { id: 'video', title: 'Qisqa videolar', text: 'IT hazillari va ilhomlantiruvchi chiqishlarni koʻring, keyin ular haqida inglizcha gapiring.' },
    { id: 'squad', title: 'Jamoa bilan', text: 'Hamkasblar bilan birga mashq qiling va haftalik “Production Down” muammosini tuzating.' },
    { id: 'games', title: 'Qisqa oʻyinlar', text: 'Bir-ikki daqiqalik oʻyinlar bilan oʻz iboralaringizni mustahkamlang.' },
    { id: 'fix', title: 'Xabarimni tuzat', text: 'Ishdagi xabar yoki emailingizni yuborishdan oldin yaxshilang.' },
  ],

  topicsTitle: 'Birinchi kurs: 6 ta mavzu',
  topics: ['Daily standup', 'Code review', 'Bugs and incidents', 'Planning and clients', 'Written messages', 'Career and interviews'],

  ctaTitle: 'Keyingi yigʻilishingizga bugundan tayyorlaning',
  ctaText: 'Birinchi darsingiz taxminan 5 daqiqa oladi.',
  ctaButton: 'Hozir boshlash',

  footerPrivacy: 'Maxfiylik',
  footerTagline: 'IT mutaxassislari uchun ingliz tili mashqi',

  privacyTitle: 'Maxfiylik siyosati',
  privacyIntro: 'LearnX qanday maʼlumotlar bilan ishlashi haqida qisqacha va ochiq maʼlumot.',
  privacySections: [
    {
      title: 'Biz saqlaydigan maʼlumotlar',
      items: [
        'Hisobingiz: ismingiz, emailingiz va parolingizning shifrlangan xeshi. Parolning oʻzi saqlanmaydi.',
        'Tanlovlaringiz: yoʻnalishingiz, maqsadingiz va darajangiz.',
        'Mashq natijalari: darslar, takrorlashlar, oʻyin natijalari, seriya va jamoa ballari.',
        'Rolli suhbatlardagi javoblaringiz matni va ularga berilgan tuzatishlar.',
      ],
    },
    {
      title: 'Saqlanmaydigan maʼlumotlar',
      items: [
        '“Xabarimni tuzat” va video mashqlariga kiritgan matningizni bazamizda saqlamaymiz.',
        'Ovoz yozuvlaringizni saqlamaymiz. Serverimizga faqat tanilgan matn keladi, takrorlab gapirish natijalari esa brauzeringizda hisoblanadi.',
      ],
    },
    {
      title: 'Boshqa xizmatlar',
      items: [
        'Anthropic: tuzatish va suhbat uchun yozgan yoki aytgan matningiz Claude AI xizmatiga yuboriladi. Maxfiy maʼlumot, parol yoki kompaniya kodini kiritmang.',
        'Email xizmati: tasdiqlash va parolni tiklash xatlari emailingizga shu xizmat orqali yuboriladi.',
        'Brauzeringiz: ovozni tanish brauzer funksiyasi orqali ishlaydi va brauzer ovozni oʻz ishlab chiqaruvchisining serverlariga yuborishi mumkin.',
        'YouTube (Google): videolar YouTube pleyerida ochiladi. Videoni ishga tushirganingizda Google maʼlumot oladi, roʻyxatdagi rasmlar ham YouTube serverlaridan yuklanadi.',
      ],
    },
    {
      title: 'Cookie va brauzer xotirasi',
      items: [
        'Suiisteʼmolning oldini olish uchun IP manzilingiz qisqa muddat saqlanadi va bir kun ichida oʻchiriladi.',
        'Hisobingizda qolishingiz uchun bitta xavfsiz cookie ishlatamiz.',
        'Oq yoki tungi rejim tanlovingiz brauzeringizda saqlanadi.',
        'Reklama uchun cookie ishlatmaymiz.',
      ],
    },
  ],
  privacyContact: 'Savollar yoki maʼlumotlaringizni oʻchirish soʻrovi uchun:',
  privacyBack: 'Bosh sahifaga',
}
