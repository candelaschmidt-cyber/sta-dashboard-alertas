export default async function handler(req, res) {
  const SCRIPT_URL = "https://script.google.com/a/macros/despegar.com/s/AKfycby5ZixwD1vBWj-_8-EET6WmlSA6EXeRiumKkjbeH_hHp_wRlEMoRHibzg2pubxDMq5a/exec";
  
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
