// Everything the owner can switch on or off from the admin page.
// kind "select" = a dropdown in the app (id). kind "pick" = a row of picture cards (box, input).
export const CATALOG = [
  { key: 'lang', label: 'Languages', kind: 'select', id: 'lang', items: [['en', 'English'], ['hi', 'Hindi'], ['bn', 'Bengali'], ['auto', 'Other (auto-detect)']] },
  { key: 'len', label: 'Clip length', kind: 'select', id: 'len', items: [['30', 'About 30 seconds'], ['60', 'About 1 minute']] },
  { key: 'model', label: 'Speech model', kind: 'select', id: 'model', items: [['tiny', 'Fast (tiny)'], ['base', 'Better (base)']] },
  { key: 'quality', label: 'Clip quality', kind: 'select', id: 'quality', items: [['light', 'Light 540p'], ['hd', 'HD 720p']] },
  { key: 'speed', label: 'Speed', kind: 'select', id: 'speed', items: [['safe', 'Safe'], ['balanced', 'Balanced'], ['fast', 'Fast']] },
  { key: 'fmt', label: 'Clip shapes', kind: 'pick', box: 'pickFmt', input: 'fmt', items: [['orig', 'Same as video'], ['9:16', 'Vertical 9:16'], ['4:5', 'Portrait 4:5'], ['1:1', 'Square 1:1'], ['16:9', 'Wide 16:9'], ['4:3', 'Classic 4:3']] },
  { key: 'frame', label: 'Framing', kind: 'pick', box: 'pickFrame', input: 'frame', items: [['follow', 'Follow the speaker'], ['center', 'Centre'], ['fit', 'Whole video'], ['split', 'Split screen'], ['pip', 'Picture in picture']] },
  { key: 'tpl', label: 'Templates', kind: 'pick', box: 'pickTpl', input: 'tpl', items: [['none', 'No template'], ['xlight', 'X post, light'], ['xdark', 'X post, dark'], ['tiktok', 'TikTok hook'], ['news', 'Breaking news']] },
  { key: 'top', label: 'Top line', kind: 'pick', box: 'pickTop', input: 'top', items: [['hook', 'Hook + topic'], ['tag', 'Topic tag only'], ['off', 'None']] },
  { key: 'cap', label: 'Caption styles', kind: 'pick', box: 'pickCap', input: 'capstyle', items: [['pop', 'Pop'], ['karaoke', 'Karaoke'], ['bold', 'Bold white'], ['movie', 'Movie subtitle'], ['bar', 'Highlight bar'], ['comic', 'Comic'], ['neon', 'Neon glow'], ['type', 'Typewriter'], ['slide', 'Slide up'], ['box', 'Classic box'], ['none', 'No captions']] }
];
