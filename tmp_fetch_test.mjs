const url = 'https://ioeuifbfvpvwrwhhrdxx.supabase.co/auth/v1/health';
fetch(url)
    .then(res => res.text())
    .then(text => console.log('Success:', text))
    .catch(err => console.error('Fetch Failed:', err));
