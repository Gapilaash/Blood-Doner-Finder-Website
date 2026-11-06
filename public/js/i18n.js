/* Blood Donor Finder - language switch (English / தமிழ் / සිංහල)
   Translates the fixed screen texts of the donor/patient website. Texts that come from the server
   (notification messages, error messages) and names are shown as they are.
   To fix or add a translation: edit a row below  [English text, Tamil, Sinhala]  (English must match the screen text exactly). */
(function () {
  const W = [
    // ---- navigation / common ----
    ['Home', 'முகப்பு', 'මුල් පිටුව'], ['About Us', 'எங்களைப் பற்றி', 'අප ගැන'], ['About us', 'எங்களைப் பற்றி', 'අප ගැන'],
    ['Can You Donate', 'நீங்கள் தானம் செய்யலாமா', 'ඔබට දන් දිය හැකිද'], ['Can you donate?', 'நீங்கள் தானம் செய்யலாமா?', 'ඔබට දන් දිය හැකිද?'],
    ['My Dashboard', 'என் முகப்புப் பலகை', 'මගේ උපකරණ පුවරුව'], ['Login', 'உள்நுழை', 'පිවිසෙන්න'], ['Log in', 'உள்நுழை', 'පිවිසෙන්න'], ['Register', 'பதிவு செய்', 'ලියාපදිංචි වන්න'],
    ['Log out', 'வெளியேறு', 'ඉවත් වන්න'], ['Log out?', 'வெளியேறவா?', 'ඉවත් වන්නද?'], ['Contact Us', 'தொடர்புகொள்ள', 'අප අමතන්න'], ['Other Links', 'மற்ற இணைப்புகள்', 'වෙනත් සබැඳි'],
    ['Requests', 'கோரிக்கைகள்', 'ඉල්ලීම්'], ['Availability', 'கிடைக்கும் தன்மை', 'ලබා ගත හැකි බව'], ['History', 'வரலாறு', 'ඉතිහාසය'], ['Profile', 'சுயவிவரம்', 'පැතිකඩ'],
    ['Notifications', 'அறிவிப்புகள்', 'දැනුම්දීම්'], ['Dashboard', 'முகப்புப் பலகை', 'උපකරණ පුවරුව'], ['My Requests', 'என் கோரிக்கைகள்', 'මගේ ඉල්ලීම්'],
    ['Confirm', 'உறுதிசெய்', 'තහවුරු කරන්න'], ['Cancel', 'ரத்துசெய்', 'අවලංගු කරන්න'], ['Done', 'முடிந்தது', 'අවසන්'], ['Back', 'பின்', 'ආපසු'], ['Next', 'அடுத்து', 'ඊළඟ'],
    ['View all', 'அனைத்தையும் பார்', 'සියල්ල බලන්න'], ['View details', 'விவரங்களைப் பார்', 'විස්තර බලන්න'], ['Select', 'தேர்ந்தெடு', 'තෝරන්න'], ['Please wait…', 'காத்திருக்கவும்…', 'කරුණාකර රැඳී සිටින්න…'],
    ['Something went wrong', 'ஏதோ தவறு நடந்துவிட்டது', 'යම් දෝෂයක් සිදු විය'], ['Back to home', 'முகப்புக்குத் திரும்பு', 'මුල් පිටුවට යන්න'], ['Loading', 'ஏற்றுகிறது', 'පූරණය වෙමින්'],
    ['Just now', 'இப்போதுதான்', 'මේ දැන්'], ['Today', 'இன்று', 'අද'], ['Never donated', 'இதுவரை தானம் செய்யவில்லை', 'කිසිදා දන් දී නැත'], ['Sri Lanka', 'இலங்கை', 'ශ්‍රී ලංකාව'],
    // ---- landing page ----
    ['Give Blood. Save Lives.', 'இரத்தம் கொடுங்கள். உயிர் காப்பீர்.', 'ලේ දන් දෙන්න. ජීවිත බේරන්න.'], ['Donate blood. Save lives.', 'இரத்த தானம் செய்யுங்கள். உயிர்களைக் காப்பாற்றுங்கள்.', 'ලේ දන් දෙන්න. ජීවිත බේරන්න.'],
    ['Donate blood, save lives', 'இரத்த தானம் செய்யுங்கள், உயிர் காப்பாற்றுங்கள்', 'ලේ දන් දෙන්න, ජීවිත බේරන්න'],
    ['Every drop counts', 'ஒவ்வொரு துளியும் முக்கியம்', 'සෑම බිංදුවක්ම වැදගත්'], ['One donation can help save up to 3 lives', 'ஒரு தானம் 3 உயிர்கள் வரை காப்பாற்ற உதவும்', 'එක් දානයකින් ජීවිත 3ක් දක්වා බේරාගත හැක'],
    ['One bag of blood can help up to three people. Register as a donor and be the reason someone gets a second chance.', 'ஒரு பை இரத்தம் மூன்று பேர் வரை உதவும். கொடையாளராகப் பதிவு செய்து, ஒருவருக்கு இரண்டாவது வாய்ப்பு கிடைக்கக் காரணமாகுங்கள்.', 'එක් රුධිර පැකට්ටුවකින් පුද්ගලයින් තිදෙනෙකුට දක්වා උපකාර කළ හැක. දායකයෙකු ලෙස ලියාපදිංචි වී කෙනෙකුට දෙවන අවස්ථාවක් ලබා දෙන්න.'],
    ['How it works', 'இது எப்படி செயல்படுகிறது', 'මෙය ක්‍රියා කරන ආකාරය'], ['Common questions', 'பொதுவான கேள்விகள்', 'නිතර ඇසෙන ප්‍රශ්න'], ['Quick answers before you register.', 'பதிவு செய்வதற்கு முன் விரைவான பதில்கள்.', 'ලියාපදිංචි වීමට පෙර ඉක්මන් පිළිතුරු.'],
    ['Blood bank finds the need', 'இரத்த வங்கி தேவையைக் கண்டறிகிறது', 'රුධිර බැංකුව අවශ්‍යතාව හඳුනාගනී'], ['Matching donors alerted', 'பொருந்தும் கொடையாளர்களுக்கு அறிவிப்பு', 'ගැලපෙන දායකයින්ට දැනුම් දේ'], ['Donate and thank', 'தானம் செய்து நன்றி கூறுதல்', 'දන් දී ස්තූති කරයි'],
    ['The blood bank team sees which patient needs blood.', 'எந்த நோயாளிக்கு இரத்தம் தேவை என்பதை இரத்த வங்கி குழு அறிகிறது.', 'කුමන රෝගියාට ලේ අවශ්‍ය දැයි රුධිර බැංකු කණ්ඩායම දැනගනී.'],
    ['Every compatible donor gets a message and can accept.', 'பொருந்தும் ஒவ்வொரு கொடையாளருக்கும் செய்தி செல்லும்; அவர் ஏற்றுக்கொள்ளலாம்.', 'ගැලපෙන සෑම දායකයෙකුටම පණිවිඩයක් ලැබෙන අතර ඔහුට පිළිගත හැක.'],
    ['Donors come to the hospital. The patient sees who donated.', 'கொடையாளர்கள் மருத்துவமனைக்கு வருகிறார்கள். யார் தானம் செய்தார் என்பதை நோயாளி பார்க்கலாம்.', 'දායකයින් රෝහලට පැමිණේ. කවුරුන් දන් දුන්නේදැයි රෝගියාට දැකිය හැක.'],
    ['Register once and get a message whenever the hospital needs your blood group.', 'ஒருமுறை பதிவு செய்தால், உங்கள் இரத்த வகை தேவைப்படும் போதெல்லாம் செய்தி வரும்.', 'එක් වරක් ලියාපදිංචි වුවහොත් ඔබේ රුධිර වර්ගය අවශ්‍ය වූ සෑම විටම පණිවිඩයක් ලැබේ.'],
    ['Blood donors', 'இரத்த கொடையாளர்கள்', 'රුධිර දායකයින්'], ['Become a donor', 'கொடையாளராகுங்கள்', 'දායකයෙකු වන්න'], ['Hospital patients', 'மருத்துவமனை நோயாளிகள்', 'රෝහල් රෝගීන්'],
    ['Register as a donor', 'கொடையாளராகப் பதிவு செய்', 'දායකයෙකු ලෙස ලියාපදිංචි වන්න'], ['Patient sign up', 'நோயாளி பதிவு', 'රෝගී ලියාපදිංචිය'],
    ['Registered donors', 'பதிவு செய்த கொடையாளர்கள்', 'ලියාපදිංචි දායකයින්'], ['Requests fulfilled', 'நிறைவேற்றிய கோரிக்கைகள்', 'ඉටු කළ ඉල්ලීම්'], ['Cities covered', 'உள்ளடக்கிய நகரங்கள்', 'ආවරණය කළ නගර'],
    ['Who can donate blood?', 'யார் இரத்த தானம் செய்யலாம்?', 'කාටද ලේ දන් දිය හැක්කේ?'], ['Is my phone number public?', 'என் தொலைபேசி எண் பகிரங்கமா?', 'මගේ දුරකථන අංකය ප්‍රසිද්ධද?'],
    ['No. Phone numbers are visible only to the blood bank team.', 'இல்லை. தொலைபேசி எண்கள் இரத்த வங்கி குழுவுக்கு மட்டுமே தெரியும்.', 'නැත. දුරකථන අංක පෙනෙන්නේ රුධිර බැංකු කණ්ඩායමට පමණි.'],
    ['Does it cost anything?', 'இதற்குக் கட்டணம் உண்டா?', 'මේ සඳහා ගාස්තුවක් තිබේද?'], ['No. Blood Donor Finder is free for donors and patients.', 'இல்லை. கொடையாளர்களுக்கும் நோயாளிகளுக்கும் இது இலவசம்.', 'නැත. දායකයින්ට සහ රෝගීන්ට මෙය නොමිලේ.'],
    // ---- can you donate ----
    ['Check if you can donate blood', 'நீங்கள் இரத்த தானம் செய்யலாமா எனப் பாருங்கள்', 'ඔබට ලේ දන් දිය හැකිදැයි පරීක්ෂා කරන්න'], ['Check', 'சரிபார்', 'පරීක්ෂා කරන්න'], ['Good to know', 'தெரிந்துகொள்ள வேண்டியவை', 'දැනගත යුතු දේ'],
    ['I am between 18 and 65 years old', 'எனக்கு 18 முதல் 65 வயது', 'මගේ වයස 18 සහ 65 අතර වේ'], ['I weigh at least 50 kg', 'என் எடை குறைந்தது 50 கிலோ', 'මගේ බර අවම වශයෙන් කිලෝ 50ක්'],
    ['I feel healthy today (no fever, cough, cold or infection)', 'இன்று நான் ஆரோக்கியமாக உணர்கிறேன் (காய்ச்சல், இருமல், சளி, தொற்று இல்லை)', 'අද මට සනීපයි (උණ, කැස්ස, සෙම්ප්‍රතිශ්‍යාව හෝආසාදනයක් නැත)'],
    ['I have not had a tattoo, piercing or surgery in the last 6 months', 'கடந்த 6 மாதங்களில் பச்சை குத்தல், துளையிடல் அல்லது அறுவை சிகிச்சை செய்யவில்லை', 'පසුගිය මාස 6 තුළ ටැටූ, සිදුරු කිරීම් හෝ සැත්කමක් කර නැත'],
    ['I am not pregnant or breastfeeding', 'நான் கர்ப்பமாகவோ பாலூட்டுபவராகவோ இல்லை', 'මම ගර්භණී හෝ කිරි දෙන්නියක් නොවෙමි'],
    ['Donating takes about 10 minutes; the whole visit around an hour.', 'தானம் செய்ய சுமார் 10 நிமிடம்; முழு வருகைக்கு சுமார் ஒரு மணி நேரம்.', 'දන් දීමට මිනිත්තු 10ක් පමණ; මුළු ගමනට පැයක් පමණ.'],
    ['Drink plenty of water and eat a normal meal before you donate.', 'தானத்திற்கு முன் நிறைய தண்ணீர் குடித்து, வழக்கமான உணவு உண்ணுங்கள்.', 'දන් දීමට පෙර බොහෝ වතුර බී සාමාන්‍ය ආහාරයක් ගන්න.'],
    ['Rest and avoid heavy exercise for the rest of the day.', 'அன்றைய நாள் ஓய்வெடுத்து, கடினமான உடற்பயிற்சியைத் தவிர்க்கவும்.', 'එදින ඉතිරි කාලය විවේක ගෙන දැඩි ව්‍යායාම මග හරින්න.'],
    ['One donation can help up to three people.', 'ஒரு தானம் மூன்று பேர் வரை உதவும்.', 'එක් දානයකින් තිදෙනෙකුට දක්වා උදව් විය හැක.'],
    ['You look eligible to donate. Register as a donor so people can reach you.', 'நீங்கள் தானம் செய்யத் தகுதியானவராகத் தெரிகிறது. கொடையாளராகப் பதிவு செய்யுங்கள்.', 'ඔබ දන් දීමට සුදුසුකම් ඇති බව පෙනේ. දායකයෙකු ලෙස ලියාපදිංචි වන්න.'],
    // ---- login / register ----
    ['Welcome', 'வரவேற்கிறோம்', 'සාදරයෙන් පිළිගනිමු'], ['Login to continue your journey', 'தொடர உள்நுழையவும்', 'ඉදිරියට යාමට පිවිසෙන්න'], ['Email or phone number', 'மின்னஞ்சல் அல்லது தொலைபேசி எண்', 'ඊමේල් හෝ දුරකථන අංකය'],
    ['Password', 'கடவுச்சொல்', 'මුරපදය'], ['Enter your password', 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்', 'ඔබේ මුරපදය ඇතුළත් කරන්න'], ['Forgot password?', 'கடவுச்சொல் மறந்துவிட்டதா?', 'මුරපදය අමතකද?'],
    ["Don't have an account?", 'கணக்கு இல்லையா?', 'ගිණුමක් නැද්ද?'], ['Already registered?', 'ஏற்கனவே பதிவு செய்துள்ளீர்களா?', 'දැනටමත් ලියාපදිංචි වී ඇත්ද?'], ['← Back to home', '← முகப்புக்குத் திரும்பு', '← මුල් පිටුවට'],
    ['Reset password', 'கடவுச்சொல்லை மீட்டமை', 'මුරපදය යළි සකසන්න'], ['Send reset code', 'மீட்டமைப்பு குறியீட்டை அனுப்பு', 'යළි සැකසුම් කේතය යවන්න'], ['New password', 'புதிய கடவுச்சொல்', 'නව මුරපදය'], ['Change password', 'கடவுச்சொல்லை மாற்று', 'මුරපදය වෙනස් කරන්න'],
    ['6-digit code', '6 இலக்கக் குறியீடு', 'ඉලක්කම් 6ක කේතය'], ['At least 8 characters, letters and numbers', 'குறைந்தது 8 எழுத்துகள், எழுத்துகளும் எண்களும்', 'අවම අක්ෂර 8ක්, අකුරු සහ ඉලක්කම්'],
    ['Create account', 'கணக்கை உருவாக்கு', 'ගිණුම සාදන්න'], ['Create an account', 'கணக்கை உருவாக்கு', 'ගිණුමක් සාදන්න'], ['Create Your Account', 'உங்கள் கணக்கை உருவாக்குங்கள்', 'ඔබේ ගිණුම සාදන්න'],
    ['Choose your role to get started', 'தொடங்க உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்', 'ආරම්භ කිරීමට ඔබේ භූමිකාව තෝරන්න'], ['Blood Donor', 'இரத்த கொடையாளர்', 'රුධිර දායකයා'], ['Save lives, be a hero', 'உயிர்களைக் காப்பாற்றுங்கள், ஹீரோ ஆகுங்கள்', 'ජීවිත බේරන්න, වීරයෙකු වන්න'],
    ['Patient / Family', 'நோயாளி / குடும்பம்', 'රෝගියා / පවුල'], ['Follow your blood status', 'உங்கள் இரத்த நிலையைப் பின்தொடருங்கள்', 'ඔබේ රුධිර තත්ත්වය අනුගමනය කරන්න'], ['Donor Registration', 'கொடையாளர் பதிவு', 'දායක ලියාපදිංචිය'], ['Patient Registration', 'நோயாளி பதிவு', 'රෝගී ලියාපදිංචිය'],
    ['Full name', 'முழுப் பெயர்', 'සම්පූර්ණ නම'], ['Enter your name', 'உங்கள் பெயரை உள்ளிடவும்', 'ඔබේ නම ඇතුළත් කරන්න'], ['Email', 'மின்னஞ்சல்', 'ඊමේල්'], ['Enter your email', 'உங்கள் மின்னஞ்சலை உள்ளிடவும்', 'ඔබේ ඊමේල් ඇතුළත් කරන්න'],
    ['Phone number', 'தொலைபேசி எண்', 'දුරකථන අංකය'], ['Phone', 'தொலைபேசி', 'දුරකථන'], ['Never shown publicly. Only the blood bank team can see it.', 'பகிரங்கமாகக் காட்டப்படாது. இரத்த வங்கி குழு மட்டுமே பார்க்கலாம்.', 'ප්‍රසිද්ධියේ නොපෙන්වයි. රුධිර බැංකු කණ්ඩායමට පමණක් පෙනේ.'],
    ['Blood group', 'இரத்த வகை', 'රුධිර වර්ගය'], ['Select blood group', 'இரத்த வகையைத் தேர்ந்தெடு', 'රුධිර වර්ගය තෝරන්න'], ['Gender', 'பாலினம்', 'ස්ත්‍රී පුරුෂ භාවය'], ['Gender (optional)', 'பாலினம் (விருப்பம்)', 'ස්ත්‍රී පුරුෂ භාවය (අත්‍යවශ්‍ය නොවේ)'],
    ['Male', 'ஆண்', 'පිරිමි'], ['Female', 'பெண்', 'ගැහැණු'], ['Other', 'மற்றவை', 'වෙනත්'], ['Prefer not to say', 'சொல்ல விரும்பவில்லை', 'කීමට අකැමතියි'], ['Date of birth', 'பிறந்த தேதி', 'උපන් දිනය'], ['Donors must be 18 to 65.', 'கொடையாளர்கள் 18 முதல் 65 வயதுக்குள் இருக்க வேண்டும்.', 'දායකයින් 18 සහ 65 අතර විය යුතුය.'],
    ['City', 'நகரம்', 'නගරය'], ['Province', 'மாகாணம்', 'පළාත'], ['Select province', 'மாகாணத்தைத் தேர்ந்தெடு', 'පළාත තෝරන්න'], ['Ward / bed (optional)', 'வார்டு / படுக்கை (விருப்பம்)', 'වාට්ටුව / ඇඳ (අත්‍යවශ්‍ය නොවේ)'], ['Ward / bed', 'வார்டு / படுக்கை', 'වාට්ටුව / ඇඳ'],
    ['Hospital reg. no. / BHT (optional)', 'மருத்துவமனை பதிவு எண் / BHT (விருப்பம்)', 'රෝහල් ලි.අං. / BHT (අත්‍යවශ්‍ය නොවේ)'], ['Hospital reg. no. / BHT', 'மருத்துவமனை பதிவு எண் / BHT', 'රෝහල් ලි.අං. / BHT'],
    ['Save & Continue', 'சேமித்துத் தொடர்', 'සුරකින්න සහ ඉදිරියට'], ['Account created. Welcome!', 'கணக்கு உருவாக்கப்பட்டது. வரவேற்கிறோம்!', 'ගිණුම සාදන ලදී. සාදරයෙන් පිළිගනිමු!'], ['Password changed. Please log in.', 'கடவுச்சொல் மாற்றப்பட்டது. உள்நுழையவும்.', 'මුරපදය වෙනස් කළා. පිවිසෙන්න.'],
    // ---- donor dashboard ----
    ['Thank you for being a donor. Your donation saves lives.', 'கொடையாளராக இருப்பதற்கு நன்றி. உங்கள் தானம் உயிர்களைக் காப்பாற்றுகிறது.', 'දායකයෙකු වීම ගැන ස්තූතියි. ඔබේ දානය ජීවිත බේරයි.'],
    ['Update availability', 'கிடைக்கும் தன்மையைப் புதுப்பி', 'ලබා ගත හැකි බව යාවත්කාලීන කරන්න'], ['Update my availability', 'என் கிடைக்கும் தன்மையைப் புதுப்பி', 'මගේ ලබා ගත හැකි බව යාවත්කාලීන කරන්න'], ['Update Availability', 'கிடைக்கும் தன்மையைப் புதுப்பி', 'ලබා ගත හැකි බව යාවත්කාලීන කරන්න'],
    ['My accepted requests', 'நான் ஏற்ற கோரிக்கைகள்', 'මා පිළිගත් ඉල්ලීම්'], ['Incoming requests', 'வரும் கோரிக்கைகள்', 'පැමිණෙන ඉල්ලීම්'], ['Accepted', 'ஏற்கப்பட்டது', 'පිළිගත්'], ['Donations', 'தானங்கள்', 'දන් දීම්'],
    ['Recent requests', 'சமீபத்திய கோரிக்கைகள்', 'මෑත ඉල්ලීම්'], ['Your status', 'உங்கள் நிலை', 'ඔබේ තත්ත්වය'], ['No donation recorded yet', 'இதுவரை தானம் பதிவு செய்யப்படவில்லை', 'තවම දන් දීමක් සටහන් වී නැත'],
    ['Quick actions', 'விரைவு செயல்கள்', 'ඉක්මන් ක්‍රියා'], ['Edit profile', 'சுயவிவரத்தைத் திருத்து', 'පැතිකඩ සංස්කරණය'], ['Available', 'கிடைக்கும்', 'ලබා ගත හැක'], ['Unavailable', 'கிடைக்காது', 'ලබා ගත නොහැක'], ['Resting', 'ஓய்வில்', 'විවේකයේ'],
    ['The hospital can alert you', 'மருத்துவமனை உங்களுக்கு அறிவிக்கலாம்', 'රෝහලට ඔබට දැනුම් දිය හැක'], ['You will not be alerted', 'உங்களுக்கு அறிவிப்பு வராது', 'ඔබට දැනුම් නොදෙයි'],
    ['Control whether the hospital can alert you.', 'மருத்துவமனை உங்களுக்கு அறிவிக்கலாமா என்பதைக் கட்டுப்படுத்துங்கள்.', 'රෝහලට ඔබට දැනුම් දිය හැකිදැයි පාලනය කරන්න.'], ['Available to Donate', 'தானம் செய்யக் கிடைக்கும்', 'දන් දීමට ලබා ගත හැක'],
    ['Last Donation Date', 'கடைசி தானம் செய்த தேதி', 'අවසන් වරට දන් දුන් දිනය'], ['Save Changes', 'மாற்றங்களைச் சேமி', 'වෙනස්කම් සුරකින්න'], ['Availability Updated!', 'கிடைக்கும் தன்மை புதுப்பிக்கப்பட்டது!', 'ලබා ගත හැකි බව යාවත්කාලීන විය!'],
    ['Your availability has been successfully updated.', 'உங்கள் கிடைக்கும் தன்மை வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது.', 'ඔබේ ලබා ගත හැකි බව සාර්ථකව යාවත්කාලීන විය.'], ['Go to Dashboard', 'முகப்புப் பலகைக்குச் செல்', 'උපකරණ පුවරුවට යන්න'], ['Back to Dashboard', 'முகப்புப் பலகைக்குத் திரும்பு', 'උපකරණ පුවරුවට ආපසු'],
    // ---- requests ----
    ['Blood Requests', 'இரத்தக் கோரிக்கைகள்', 'රුධිර ඉල්ලීම්'], ['My Blood Requests', 'என் இரத்தக் கோரிக்கைகள்', 'මගේ රුධිර ඉල්ලීම්'], ['Requests the blood bank sent you because your blood group can help.', 'உங்கள் இரத்த வகை உதவக்கூடும் என்பதால் இரத்த வங்கி அனுப்பிய கோரிக்கைகள்.', 'ඔබේ රුධිර වර්ගයට උදව් කළ හැකි නිසා රුධිර බැංකුව එවූ ඉල්ලීම්.'],
    ['No requests yet', 'இதுவரை கோரிக்கைகள் இல்லை', 'තවම ඉල්ලීම් නැත'], ['No requests need you right now', 'இப்போது உங்களுக்கான கோரிக்கைகள் இல்லை', 'දැන් ඔබට අදාළ ඉල්ලීම් නැත'], ['The hospital will message you when your blood group is needed.', 'உங்கள் இரத்த வகை தேவைப்படும்போது மருத்துவமனை செய்தி அனுப்பும்.', 'ඔබේ රුධිර වර්ගය අවශ්‍ය වූ විට රෝහල පණිවිඩයක් එවයි.'],
    ['Emergency', 'அவசரம்', 'හදිසි'], ['Urgent', 'அவசியம்', 'ඉක්මන්'], ['Normal', 'சாதாரணம்', 'සාමාන්‍ය'], ['Pending', 'நிலுவையில்', 'පොරොත්තුවෙන්'], ['Completed', 'முடிந்தது', 'සම්පූර්ණයි'], ['Declined', 'நிராகரிக்கப்பட்டது', 'ප්‍රතික්ෂේප කළ'], ['Cancelled', 'ரத்து செய்யப்பட்டது', 'අවලංගු කළ'], ['Expired', 'காலாவதியானது', 'කල් ඉකුත් වූ'], ['Filled', 'நிரம்பியது', 'සම්පූර්ණ වූ'],
    ['Request Details', 'கோரிக்கை விவரங்கள்', 'ඉල්ලීමේ විස්තර'], ['Request ID', 'கோரிக்கை எண்', 'ඉල්ලීම් අංකය'], ['Patient Information', 'நோயாளி தகவல்', 'රෝගී තොරතුරු'], ['Hospital', 'மருத்துவமனை', 'රෝහල'], ['Blood group / units', 'இரத்த வகை / அலகுகள்', 'රුධිර වර්ගය / ඒකක'], ['Reason', 'காரணம்', 'හේතුව'], ['Note', 'குறிப்பு', 'සටහන'], ['Patient', 'நோயாளி', 'රෝගියා'],
    ['Accept Request', 'கோரிக்கையை ஏற்று', 'ඉල්ලීම පිළිගන්න'], ['Decline Request', 'கோரிக்கையை நிராகரி', 'ඉල්ලීම ප්‍රතික්ෂේප කරන්න'], ['I can no longer donate', 'என்னால் இனி தானம் செய்ய முடியாது', 'මට තවදුරටත් දන් දිය නොහැක'], ['Accept request', 'கோரிக்கையை ஏற்று', 'ඉල්ලීම පිළිගන්න'],
    ['When can you come?', 'நீங்கள் எப்போது வர முடியும்?', 'ඔබට පැමිණිය හැක්කේ කවදාද?'], ['Tell the blood bank when you expect to reach the hospital.', 'நீங்கள் மருத்துவமனைக்கு எப்போது வருவீர்கள் என்று இரத்த வங்கிக்குத் தெரிவியுங்கள்.', 'ඔබ රෝහලට පැමිණෙන වේලාව රුධිර බැංකුවට දන්වන්න.'],
    ['I can come', 'நான் வர முடியும்', 'මට පැමිණිය හැක'], ['Right now', 'இப்போதே', 'දැන්ම'], ['Within 2 hours', '2 மணி நேரத்திற்குள்', 'පැය 2ක් ඇතුළත'], ['Later today', 'இன்று பிற்பகுதியில்', 'අද පසුව'], ['Tomorrow', 'நாளை', 'හෙට'],
    ['Decline this request?', 'இந்தக் கோரிக்கையை நிராகரிக்கவா?', 'මෙම ඉල්ලීම ප්‍රතික්ෂේප කරන්නද?'], ['The hospital will look for another donor.', 'மருத்துவமனை வேறு கொடையாளரைத் தேடும்.', 'රෝහල වෙනත් දායකයෙකු සොයයි.'], ['Decline', 'நிராகரி', 'ප්‍රතික්ෂේප කරන්න'],
    ['Request Accepted!', 'கோரிக்கை ஏற்கப்பட்டது!', 'ඉල්ලීම පිළිගත්තා!'], ['Request Declined!', 'கோரிக்கை நிராகரிக்கப்பட்டது!', 'ඉල්ලීම ප්‍රතික්ෂේප කළා!'], ['You declined this request.', 'நீங்கள் இந்தக் கோரிக்கையை நிராகரித்தீர்கள்.', 'ඔබ මෙම ඉල්ලීම ප්‍රතික්ෂේප කළා.'],
    ['Your donation was recorded. Thank you for saving a life!', 'உங்கள் தானம் பதிவு செய்யப்பட்டது. உயிரைக் காப்பாற்றியதற்கு நன்றி!', 'ඔබේ දානය සටහන් විය. ජීවිතයක් බේරූ ඔබට ස්තූතියි!'],
    ['Enough donors have already confirmed for this request. Thank you for being ready to help!', 'இந்தக் கோரிக்கைக்குப் போதுமான கொடையாளர்கள் ஏற்கனவே உறுதிசெய்துவிட்டனர். உதவ முன்வந்ததற்கு நன்றி!', 'මෙම ඉල්ලීමට ප්‍රමාණවත් දායකයින් දැනටමත් තහවුරු කර ඇත. උදව් කිරීමට සූදානම් වීම ගැන ස්තූතියි!'],
    ['Donors for you', 'உங்களுக்கான கொடையாளர்கள்', 'ඔබට දායකයින්'], ['Donors who donated for you', 'உங்களுக்காக தானம் செய்த கொடையாளர்கள்', 'ඔබ වෙනුවෙන් දන් දුන් දායකයින්'], ['Donors who helped you', 'உங்களுக்கு உதவிய கொடையாளர்கள்', 'ඔබට උදව් කළ දායකයින්'],
    ['The blood bank is arranging donors for you.', 'இரத்த வங்கி உங்களுக்காக கொடையாளர்களை ஏற்பாடு செய்கிறது.', 'රුධිර බැංකුව ඔබ වෙනුවෙන් දායකයින් සූදානම් කරමින් සිටී.'],
    ['The blood bank team is arranging donors for you. You do not need to do anything.', 'இரத்த வங்கி குழு உங்களுக்காக கொடையாளர்களை ஏற்பாடு செய்கிறது. நீங்கள் எதுவும் செய்ய வேண்டியதில்லை.', 'රුධිර බැංකු කණ්ඩායම ඔබ වෙනුවෙන් දායකයින් සූදානම් කරයි. ඔබ කිසිවක් කළ යුතු නැත.'],
    ['All donors have agreed. They will come to the blood bank to donate.', 'அனைத்து கொடையாளர்களும் ஒப்புக்கொண்டனர். அவர்கள் தானம் செய்ய இரத்த வங்கிக்கு வருவார்கள்.', 'සියලු දායකයින් එකඟ වී ඇත. ඔවුන් දන් දීමට රුධිර බැංකුවට පැමිණේ.'],
    ['All the blood you needed has been donated.', 'உங்களுக்குத் தேவையான இரத்தம் முழுவதும் தானம் செய்யப்பட்டுவிட்டது.', 'ඔබට අවශ්‍ය සියලු රුධිරය දන් දී ඇත.'],
    ['No donations yet', 'இதுவரை தானங்கள் இல்லை', 'තවම දන් දීම් නැත'], ['When a donor gives blood for you, their name appears here.', 'ஒரு கொடையாளர் உங்களுக்காக இரத்தம் கொடுத்தால், அவர் பெயர் இங்கே தோன்றும்.', 'දායකයෙකු ඔබ වෙනුවෙන් ලේ දුන් විට ඔහුගේ නම මෙහි පෙනේ.'],
    ['Report this request', 'இந்தக் கோரிக்கையைப் புகாரளி', 'මෙම ඉල්ලීම වාර්තා කරන්න'], ['Send report', 'புகாரை அனுப்பு', 'වාර්තාව යවන්න'], ['Report sent. Thank you.', 'புகார் அனுப்பப்பட்டது. நன்றி.', 'වාර්තාව යවන ලදී. ස්තූතියි.'],
    // ---- history, badges, certificate ----
    ['Donation History', 'தான வரலாறு', 'දන් දීම් ඉතිහාසය'], ['Donation history', 'தான வரலாறு', 'දන් දීම් ඉතිහාසය'], ['Every donation you have completed through the platform.', 'தளத்தின் மூலம் நீங்கள் முடித்த ஒவ்வொரு தானமும்.', 'වේදිකාව හරහා ඔබ සම්පූර්ණ කළ සෑම දන් දීමක්ම.'],
    ['Total donations', 'மொத்த தானங்கள்', 'මුළු දන් දීම්'], ['Next eligible', 'அடுத்த தகுதி நாள்', 'ඊළඟ සුදුසුකම් දිනය'], ['Now', 'இப்போது', 'දැන්'], ['Completed donations', 'முடிந்த தானங்கள்', 'සම්පූර්ණ කළ දන් දීම්'], ['Your confirmed donations will be listed here.', 'உறுதிசெய்யப்பட்ட உங்கள் தானங்கள் இங்கே பட்டியலிடப்படும்.', 'ඔබේ තහවුරු කළ දන් දීම් මෙහි ලැයිස්තුගත වේ.'],
    ['Your badges', 'உங்கள் பதக்கங்கள்', 'ඔබේ ලාංඡන'], ['First Drop', 'முதல் துளி', 'පළමු බිංදුව'], ['Life Saver', 'உயிர்காப்பாளர்', 'ජීවිත රැකවරණය'], ['Hero', 'நாயகன்', 'වීරයා'], ['Champion', 'சாம்பியன்', 'ශූරයා'], ['Legend', 'புகழ்பெற்றவர்', 'ජනප්‍රවාදය'],
    ['You earned every badge. Thank you, Legend!', 'அனைத்து பதக்கங்களையும் பெற்றுவிட்டீர்கள். நன்றி!', 'ඔබ සියලු ලාංඡන දිනා ඇත. ස්තූතියි!'], ['Certificate', 'சான்றிதழ்', 'සහතිකය'], ['Print / Save as PDF', 'அச்சிடு / PDF ஆகச் சேமி', 'මුද්‍රණය / PDF ලෙස සුරකින්න'],
    ['Blood Donation Certificate', 'இரத்த தான சான்றிதழ்', 'රුධිර දාන සහතිකය'], ['CERTIFICATE OF APPRECIATION', 'பாராட்டுச் சான்றிதழ்', 'ප්‍රශංසා සහතිකය'], ['This certificate is proudly presented to', 'இந்தச் சான்றிதழ் பெருமையுடன் வழங்கப்படுகிறது', 'මෙම සහතිකය ආඩම්බරයෙන් පිරිනමනු ලැබේ'],
    // ---- notifications / profile ----
    ['Mark all read', 'அனைத்தையும் படித்ததாகக் குறி', 'සියල්ල කියවූ ලෙස සලකුණු කරන්න'], ['You are all caught up', 'அனைத்தும் பார்த்துவிட்டீர்கள்', 'ඔබ සියල්ල බලා අවසන්'], ['New alerts about requests and campaigns show up here.', 'கோரிக்கைகள் மற்றும் பிரச்சாரங்கள் பற்றிய புதிய அறிவிப்புகள் இங்கே தோன்றும்.', 'ඉල්ලීම් සහ ව්‍යාපාර පිළිබඳ නව දැනුම්දීම් මෙහි පෙනේ.'],
    ['My Profile', 'என் சுயவிவரம்', 'මගේ පැතිකඩ'], ['Keep your details up to date.', 'உங்கள் விவரங்களைப் புதுப்பித்து வைத்திருங்கள்.', 'ඔබේ තොරතුරු යාවත්කාලීනව තබා ගන්න.'], ['Profile saved.', 'சுயவிவரம் சேமிக்கப்பட்டது.', 'පැතිකඩ සුරකින ලදී.'], ['About you', 'உங்களைப் பற்றி', 'ඔබ ගැන'],
    ['Update password', 'கடவுச்சொல்லைப் புதுப்பி', 'මුරපදය යාවත්කාලීන කරන්න'], ['Current password', 'தற்போதைய கடவுச்சொல்', 'වත්මන් මුරපදය'], ['Password updated.', 'கடவுச்சொல் புதுப்பிக்கப்பட்டது.', 'මුරපදය යාවත්කාලීන විය.'], ['Delete my account', 'என் கணக்கை நீக்கு', 'මගේ ගිණුම මකන්න'], ['Delete account', 'கணக்கை நீக்கு', 'ගිණුම මකන්න'], ['Delete your account?', 'உங்கள் கணக்கை நீக்கவா?', 'ඔබේ ගිණුම මකන්නද?'],
    ['You will need to sign in again to use your account.', 'உங்கள் கணக்கைப் பயன்படுத்த மீண்டும் உள்நுழைய வேண்டும்.', 'ඔබේ ගිණුම භාවිතයට නැවත පිවිසිය යුතුය.'], ['You are logged out.', 'நீங்கள் வெளியேறிவிட்டீர்கள்.', 'ඔබ ඉවත් වී ඇත.'], ['Blood donor', 'இரத்த கொடையாளர்', 'රුධිර දායකයා'], ['Patient / family', 'நோயாளி / குடும்பம்', 'රෝගියා / පවුල'],
    ['Cannot reach the server. Check your connection and try again.', 'சேவையகத்தை அடைய முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.', 'සේවාදායකයට ළඟා විය නොහැක. සම්බන්ධතාව පරීක්ෂා කර නැවත උත්සාහ කරන්න.'], ['Please log in again.', 'மீண்டும் உள்நுழையவும்.', 'නැවත පිවිසෙන්න.'], ['Session expired. Please log in again.', 'அமர்வு முடிந்தது. மீண்டும் உள்நுழையவும்.', 'සැසිය අවසන්. නැවත පිවිසෙන්න.'],
    ['Patient dashboard', 'நோயாளி முகப்புப் பலகை', 'රෝගී උපකරණ පුවරුව'], ['Your current blood need', 'உங்கள் தற்போதைய இரத்தத் தேவை', 'ඔබේ වත්මන් රුධිර අවශ්‍යතාව'], ['Open needs', 'திறந்த தேவைகள்', 'විවෘත අවශ්‍යතා']
  ];
  const PAT = [ // dynamic texts: [regex, tamil, sinhala]  ($1 = captured part)
    [/^Welcome back, (.+)$/, 'மீண்டும் வருக, $1', 'නැවත සාදරයෙන් පිළිගනිමු, $1'],
    [/^Last donation: (.+)$/, 'கடைசி தானம்: $1', 'අවසන් දානය: $1'],
    [/^(\d+) units?$/, '$1 அலகு', 'ඒකක $1'],
    [/^(\d+) more donations? to earn “(.+)”\.$/, '“$2” பதக்கம் பெற இன்னும் $1 தானம்', '“$2” ලාංඡනය ලබා ගැනීමට තවත් දන් දීම් $1'],
    [/^(\d+) donations?$/, '$1 தானம்', 'දන් දීම් $1']
  ];
  const LANGS = [['en', 'EN'], ['ta', 'தமிழ்'], ['si', 'සිංහල']];
  let lang = 'en'; try { lang = localStorage.getItem('bdf_lang') || 'en'; } catch { }
  if (!LANGS.some(l => l[0] === lang)) lang = 'en';
  document.documentElement.lang = lang;

  const idx = lang === 'ta' ? 1 : 2, MAP = new Map();
  if (lang !== 'en') W.forEach(r => MAP.set(r[0], r[idx]));
  const norm = s => s.replace(/\s+/g, ' ').trim();
  function tr(text) {
    if (MAP.has(text)) return MAP.get(text);
    for (const p of PAT) { const m = p[0].exec(text); if (m) return p[idx].replace(/\$(\d)/g, (_, i) => m[i]); }
    return null;
  }
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
  function walk(root) {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentNode && !SKIP.has(n.parentNode.nodeName) && n.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
    for (const n of nodes) {
      const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(n.nodeValue), out = tr(norm(m[2]));
      if (out && out !== m[2]) n.nodeValue = m[1] + out + m[3];
    }
    root.querySelectorAll && root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(el => {
      ['placeholder', 'title', 'aria-label', 'alt'].forEach(a => { const v = el.getAttribute(a); if (v) { const out = tr(norm(v)); if (out) el.setAttribute(a, out); } });
    });
  }
  let timer = 0, busy = false;
  function run() { timer = 0; if (busy) return; busy = true; try { walk(document.body); } finally { busy = false; } }

  function switcher() {
    if (document.getElementById('langsw')) return;
    const d = document.createElement('div'); d.id = 'langsw'; d.setAttribute('role', 'group'); d.setAttribute('aria-label', 'Language');
    d.innerHTML = LANGS.map(([k, n]) => `<button type="button" data-lang="${k}" class="${k === lang ? 'on' : ''}" translate="no">${n}</button>`).join('');
    d.onclick = e => { const b = e.target.closest('[data-lang]'); if (!b || b.dataset.lang === lang) return; try { localStorage.setItem('bdf_lang', b.dataset.lang); } catch { } location.reload(); };
    document.body.appendChild(d);
  }
  function start() {
    switcher();
    if (lang === 'en') return;
    run();
    new MutationObserver(() => { if (!timer && !busy) timer = setTimeout(run, 40); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
