(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const hotelOnly = new URLSearchParams(location.search).get('version') === 'hotel';
  const zones = ['intro', 'planning', 'confirmed', 'later'];
  const brands = [
    { value: '如家酒店', icon: '⌂', note: '具体分店一起商量' },
    { value: '汉庭酒店', icon: '⌂', note: '具体分店一起商量' }
  ];
  const places = [
    { value: '酒店', icon: '⌂', note: '如家 / 汉庭' },
    { value: '游乐园', icon: '♧', note: '一起收集快乐' },
    { value: '饭店', icon: '♨', note: '好好吃一顿饭' },
    { value: '学校', icon: '▤', note: '在校园公共区域见面' }
  ];
  const activities = [
    { value: '亲密时光', icon: '♡', note: '亲密意向，届时双方再确认' },
    { value: '吃饭', icon: '♨', note: '' },
    { value: '画画', icon: '✎', note: '' },
    { value: '逛街', icon: '♧', note: '' },
    { value: '暂不决定', icon: '✧', note: '见面再慢慢商量' }
  ];
  let confirmedPlan = null;
  let toastTimer;

  function choice(item, name, checked = false) {
    const label = document.createElement('label');
    label.className = 'choice';
    const input = document.createElement('input');
    input.type = 'radio'; input.name = name; input.value = item.value; input.checked = checked;
    input.setAttribute('aria-label', item.value);
    const icon = document.createElement('span'); icon.className = 'choice-icon'; icon.textContent = item.icon; icon.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('span'); copy.className = 'choice-copy'; copy.textContent = item.value;
    if (item.note) { const note = document.createElement('small'); note.textContent = item.note; copy.append(note); }
    label.append(input, icon, copy);
    return label;
  }
  (hotelOnly ? brands : places).forEach((p) => $('locations').append(choice(p, 'location')));
  brands.forEach((p) => $('hotel-brands').append(choice(p, 'hotel')));
  activities.forEach((p) => $('activities').append(choice(p, 'activity', p.value === '暂不决定')));
  $('version-note').textContent = `${hotelOnly ? '酒店版 · 如家 / 汉庭' : '随心版 · 让见面多一点可能'} · 互动邀请，无真实预订`;
  $('location-hint').textContent = hotelOnly ? '仅提供如家酒店、汉庭酒店。具体城市和分店可一起商量。' : '先选想去的地方，具体地址可以之后一起商量。';
  document.querySelector('.brand').href = hotelOnly ? './?version=hotel' : './';

  function chinaToday() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }
  function addDays(date, days) {
    const d = new Date(`${date}T12:00:00+08:00`); d.setUTCDate(d.getUTCDate() + days);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }
  function refreshMinDate() { $('date').min = chinaToday(); }
  refreshMinDate();
  $('date').value = addDays(chinaToday(), 1);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshMinDate(); });
  $('date').addEventListener('focus', refreshMinDate);

  function show(screen, step = 0) {
    zones.forEach((id) => { $(id).hidden = id !== screen; });
    document.querySelectorAll('[data-step]').forEach((el, index) => {
      el.classList.toggle('current', index === step); el.classList.toggle('complete', index < step);
      if (index === step) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
    const heading = $(screen).querySelector('h1,h2');
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  $('accept').addEventListener('click', () => { refreshMinDate(); show('planning', 1); });
  $('think').addEventListener('click', () => show('later'));
  $('return-intro').addEventListener('click', () => show('intro'));
  $('back-intro').addEventListener('click', () => show('intro'));
  $('edit-plan').addEventListener('click', () => { confirmedPlan = null; show('planning', 1); });
  document.querySelectorAll('[data-day]').forEach((button) => {
    button.addEventListener('click', () => {
      const today = chinaToday();
      let days = Number(button.dataset.day);
      if (button.dataset.day === 'weekend') {
        const day = new Date(`${today}T12:00:00+08:00`).getUTCDay();
        days = (6 - day + 7) % 7;
      }
      $('date').value = addDays(today, days);
      updateQuickDates();
    });
  });
  function updateQuickDates() {
    document.querySelectorAll('[data-day]').forEach((button) => {
      let days = Number(button.dataset.day);
      if (button.dataset.day === 'weekend') days = (6 - new Date(`${chinaToday()}T12:00:00+08:00`).getUTCDay() + 7) % 7;
      button.classList.toggle('active', $('date').value === addDays(chinaToday(), days));
    });
  }
  updateQuickDates();
  $('date').addEventListener('change', updateQuickDates);
  const selected = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
  $('locations').addEventListener('change', () => {
    $('hotel-detail').hidden = hotelOnly || selected('location') !== '酒店';
    $('form-error').hidden = true;
  });
  $('date-form').addEventListener('input', () => { $('form-error').hidden = true; });
  function error(message, target) {
    $('form-error').textContent = message; $('form-error').hidden = false;
    if (target) target.focus();
    $('form-error').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function dateLabel(date) {
    return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(`${date}T12:00:00+08:00`));
  }
  $('date-form').addEventListener('submit', (event) => {
    event.preventDefault();
    refreshMinDate();
    const date = $('date').value, time = $('time').value;
    const when = new Date(`${date}T${time}:00+08:00`);
    if (!date || !time || !Number.isFinite(when.getTime()) || when <= new Date()) return error('挑一个还没到来的时间吧，期待总要留在未来。', $('date'));
    const place = selected('location');
    if (!(hotelOnly ? brands : places).some((p) => p.value === place)) return error('还差一个见面地点，选一个让你自在的地方吧。', document.querySelector('input[name="location"]'));
    let finalPlace = place;
    if (!hotelOnly && place === '酒店') {
      if (!brands.some((b) => b.value === selected('hotel'))) return error('选一下如家或汉庭，具体分店可以之后再商量。', document.querySelector('input[name="hotel"]'));
      finalPlace = selected('hotel');
    }
    confirmedPlan = { date, time, place: finalPlace, address: $('address').value.trim(), activity: selected('activity') || '暂不决定' };
    $('result-date').textContent = dateLabel(date);
    $('result-time').textContent = `${time} · 北京时间`;
    $('result-location').textContent = finalPlace;
    $('result-address').textContent = confirmedPlan.address || '具体地址，我们一起商量';
    $('result-activity').textContent = confirmedPlan.activity === '暂不决定' ? '见面再商量' : confirmedPlan.activity;
    document.querySelector('.ticket-promise').firstChild.textContent = confirmedPlan.activity === '亲密时光' ? '亲密意向不代表同意，届时双方再确认。' : '带上好心情就好，其他的见面再说。';
    show('confirmed', 2);
  });
  function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('visible'); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3400); }
  function planText() {
    const p = confirmedPlan;
    return `💌 我们的小小约定\n\n时间：${dateLabel(p.date)} ${p.time}（北京时间）\n地点：${p.place}\n地址：${p.address || '具体地址一起商量'}\n想做的事：${p.activity === '暂不决定' ? '见面再商量' : p.activity}\n\n${p.activity === '亲密时光' ? '亲密意向不代表同意，届时双方再确认。\n' : ''}仅为邀请，随时可以调整；不代表酒店预订。\n到时候见 ♡`;
  }
  $('copy-card').addEventListener('click', async () => {
    if (!confirmedPlan) return;
    const text = planText();
    try { await navigator.clipboard.writeText(text); toast('约定已复制，发给对方就好 ♡'); }
    catch { $('copy-text').value = text; $('copy-dialog').showModal(); $('copy-text').select(); }
  });
  $('close-dialog').addEventListener('click', () => $('copy-dialog').close());

  function drawCard(p) {
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1420;
    const c = canvas.getContext('2d');
    c.fillStyle = '#fbf6ef'; c.fillRect(0, 0, 1080, 1420);
    c.fillStyle = '#f3d9df'; c.fillRect(70, 70, 940, 130);
    c.fillStyle = '#fffaf6'; c.fillRect(70, 200, 940, 1100);
    c.strokeStyle = '#e0c2c7'; c.lineWidth = 2; c.strokeRect(70, 70, 940, 1230);
    const font = '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    const text = (t, x, y, size, color = '#673d4c') => { c.fillStyle = color; c.font = `${size}px ${font}`; c.fillText(t, x, y); };
    text('心动邮局 · 约会确认卡', 125, 150, 28, '#96576a');
    text('FOR US ♡', 785, 150, 23, '#96576a');
    text('SAVE OUR LITTLE MOMENT', 125, 285, 20, '#b38995');
    text('把这一天，留给我们。', 125, 375, 54);
    text('约定时间', 125, 475, 25, '#a07f89');
    text(dateLabel(p.date), 125, 535, 36);
    text(`${p.time} · 北京时间`, 125, 605, 44, '#b2526c');
    text('见面地点', 125, 705, 25, '#a07f89');
    text(p.place, 125, 765, 40);
    const address = p.address || '具体地址，我们一起商量';
    c.font = `25px ${font}`;
    let line = '', y = 815;
    for (const char of address) {
      if (c.measureText(line + char).width > 820) { text(line, 125, y, 25, '#9b7a85'); y += 37; line = char; }
      else line += char;
    }
    if (line) text(line, 125, y, 25, '#9b7a85');
    text('想一起做的事', 125, 970, 25, '#a07f89');
    text(p.activity === '暂不决定' ? '见面再商量' : p.activity, 125, 1030, 39);
    c.strokeStyle = '#e9d6db'; c.beginPath(); c.moveTo(125, 1100); c.lineTo(955, 1100); c.stroke();
    text(p.activity === '亲密时光' ? '亲密意向不代表同意，届时双方再确认。' : '带上好心情就好，其他的见面再说。', 125, 1160, 25, '#a5818d');
    text('仅为邀请 · 随时可以调整 · 不代表酒店预订', 125, 1250, 23, '#a5818d');
    text('慢慢来，见面本来就是一件值得期待的事。', 250, 1360, 23, '#ad9197');
    return canvas;
  }
  $('save-card').addEventListener('click', async () => {
    if (!confirmedPlan) return;
    const button = $('save-card'); button.disabled = true; button.textContent = '正在准备确认卡…';
    try {
      const canvas = drawCard(confirmedPlan);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('No image');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `我们的约定-${confirmedPlan.date}.png`; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast('确认卡已准备好，可在下载中查看；也可以截图保存。');
    } catch { toast('图片保存暂不可用，可以截图或复制约定。'); }
    finally { button.disabled = false; button.textContent = '↓  保存确认卡'; }
  });
})();
