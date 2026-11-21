// Every question lives here once. The FAQ page and the search menu both read this list.
export const FAQ = [
  // Getting started
  ['Getting started', 'What is Klipu?', 'Klipu is a free tool that turns one long video into several short clips. It listens to the speech, picks the strongest moments, cuts them, burns in captions and a top line, and writes a title, description and hashtags for each clip.'],
  ['Getting started', 'How do I make my first clips?', 'Open the Clip app, choose a video file, pick the clip length and how many clips you want, then tap "Make my clips". Keep the tab open until every clip shows Download.'],
  ['Getting started', 'Do I need to install anything?', 'No. Klipu runs in your browser. On Chrome you can also add it to your home screen from the menu, so it opens like an app.'],
  ['Getting started', 'Which browser works best?', 'Chrome on Android or on a computer. Other modern browsers may work, but Chrome is the one it is tested with.'],
  ['Getting started', 'Can I paste a YouTube or other link?', 'No. Klipu only works with a video file from your device. Download the video first, then choose it in the app.'],
  // Videos and clips
  ['Videos and clips', 'Which video files can I use?', 'Files your browser can play, usually MP4, MOV and WebM. If a file will not open, try converting it to MP4 first.'],
  ['Videos and clips', 'Is there a maximum video length or file size?', 'Klipu sets no limit itself. The real limit is your device: a long video takes longer and needs more memory. If your phone struggles, use a shorter video or the Safe speed.'],
  ['Videos and clips', 'How long are the clips?', 'You choose: about 30 seconds or about 1 minute. Klipu ends a clip at a natural sentence break, so the exact length can differ a little.'],
  ['Videos and clips', 'How many clips can I get?', 'From 1 (the best one only) up to 15 per run.'],
  ['Videos and clips', 'How does Klipu choose the moments?', 'It transcribes the speech, then scores sentences and stretches of speech for things like strong statements, questions, numbers and energy, and keeps the best ones that do not overlap. It is a helper, not a judge. Always watch the clips and drop the ones you do not like.'],
  ['Videos and clips', 'Which clip shapes are available?', 'Same as video, vertical 9:16, portrait 4:5, square 1:1, wide 16:9 and classic 4:3.'],
  ['Videos and clips', 'What does "Follow the speaker" do?', 'When the clip is narrower than the video, Klipu watches which part of the picture moves the most and keeps the frame there. Other framings are Centre, Whole video with blurred edges, Split screen and Picture in picture.'],
  ['Videos and clips', 'What are the templates?', 'Templates put the clip inside a ready-made frame: X post (light or dark), TikTok hook or Breaking news. They are for the vertical 9:16 shape only.'],
  // Captions
  ['Captions and text', 'What caption styles are there?', 'Eleven: Pop, Karaoke, Bold white, Movie subtitle, Highlight bar, Comic, Neon glow, Typewriter, Slide up, Classic box, and No captions.'],
  ['Captions and text', 'What is the top line?', 'A topic tag and the key sentence of the clip, shown above the picture as a hook. You can switch it to the tag only, or turn it off.'],
  ['Captions and text', 'The captions have mistakes. Can I fix them?', 'Not inside Klipu yet. The speech model is good but not perfect, especially with accents, noise or music. Choosing "Better (base)" in Speech model gives more accurate captions.'],
  ['Captions and text', 'What is the post text?', 'For every clip you get a title, a description and hashtags that you can copy and paste into your post. It is generated on your device from what was said.'],
  // Languages
  ['Languages', 'Which languages work?', 'English works best. Hindi and Bengali are available, and "Other" lets the model detect the language. Quality is lower for languages other than English.'],
  ['Languages', 'Why is Hindi or Bengali slower?', 'These languages use the larger speech engine, a download of about 150 MB the first time. Pick "Better (base)" for them, because the small one makes many mistakes.'],
  // Privacy
  ['Privacy and safety', 'Is my video uploaded anywhere?', 'No. The video is read and cut inside your browser. It is not sent to a Klipu server, because there is none for video.'],
  ['Privacy and safety', 'What data does Klipu store?', 'If you sign in, your sign-in account is handled by Supabase. If you write a review, your name, rating and comment are stored so others can read them. Nothing from your videos is stored.'],
  ['Privacy and safety', 'Does it need the internet?', 'Yes at first. The first run downloads the speech model once, and your browser keeps it. The page itself also loads from the internet.'],
  ['Privacy and safety', 'Where do the downloaded clips go?', 'To your device, in your normal downloads. Klipu does not keep a copy.'],
  // Phone and speed
  ['Phone and speed', 'Why is it slow on my phone?', 'The AI runs on your phone, and a phone is much weaker than a server. Use the Safe speed, keep the screen on, keep the phone plugged in, and use fewer clips.'],
  ['Phone and speed', 'The page crashed or says "Aw, Snap!". What now?', 'Choose Safe speed and Light 540p quality, close other tabs and apps, and try again. A shorter video also helps.'],
  ['Phone and speed', 'Can I lock the screen while it works?', 'It is better not to. Phones pause browser tabs in the background. Klipu asks the screen to stay awake, but keep the tab in front.'],
  ['Phone and speed', 'What is the difference between Safe, Balanced and Fast?', 'They set how many helpers work at the same time. Safe is smoothest on a phone. Balanced and Fast are quicker on strong phones and laptops but may make a phone hot or slow.'],
  ['Phone and speed', 'There is a game while I wait. Why?', 'Making clips takes time, so we added a small game to pass it. It does not slow the clips down on purpose.'],
  // Account
  ['Account and login', 'Do I need an account?', 'It depends on how this site is set up. When login is on, you sign in with Google or with an email and password before using the app.'],
  ['Account and login', 'How do I sign in?', 'Open the Login page and choose "Continue with Google", or use your email and a password of at least 8 characters.'],
  ['Account and login', 'I forgot my password.', 'On the Login page tap "Forgot password?", type your email and we send a reset link.'],
  ['Account and login', 'How do I leave a review?', 'Open the Reviews page, give 1 to 5 stars and write a short comment. You can edit or delete your review later. You need to be signed in.'],
  // Sharing
  ['Posting and sharing', 'Does Klipu post to Instagram or TikTok for me?', 'Not yet. Today you download the clip and copy the post text, then post yourself. Automatic posting may come later.'],
  ['Posting and sharing', 'Which platforms are the clips made for?', 'YouTube Shorts, Instagram Reels and TikTok (vertical 9:16), and feed posts (4:5, 1:1) or YouTube (16:9).'],
  // Free
  ['Free and ads', 'Is Klipu really free?', 'Yes. There is no payment and no clip limit set by Klipu.'],
  ['Free and ads', 'Why is there a Klipu mark on my clips?', 'Klipu adds its logo near the bottom of every clip so people who see your clip can find the tool. Later you may be able to remove it by watching an ad.'],
  ['Free and ads', 'Will there be ads?', 'There may be small sponsor lines at the top or bottom of the app. They are always marked "Ad".'],
  // Troubleshooting
  ['Troubleshooting', 'The video could not be opened.', 'Your browser could not decode the file. Convert it to MP4 (H.264) and try again. Each clip also has a "Try again" button.'],
  ['Troubleshooting', 'The clip shows 1 second in my gallery.', 'Klipu writes the real length into the file, so this should not happen. If it does, play the clip once or download it again.'],
  ['Troubleshooting', 'No speech was found.', 'The video may have no clear talking, or the wrong language is selected. Check the language setting and try the Better (base) model.'],
  ['Troubleshooting', 'The model will not download.', 'Check your internet and try again. Some networks block the download hosts. Switch to mobile data or another network.'],
  ['Troubleshooting', 'I found a bug or have an idea.', 'Tell us on the Reviews page. It is the place we read first.'],
];
