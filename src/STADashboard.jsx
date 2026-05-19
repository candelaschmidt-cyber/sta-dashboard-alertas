import { useState, useMemo, useEffect } from "react";

const CAUSE_LABELS = {
  no_saldo:  { text:'Sin saldo', bg:'#FCEBEB', color:'#791F1F', icon:'ti-wallet-off' },
  campanas:  { text:'Pausó campañas', bg:'#EEEDFE', color:'#3C3489', icon:'ti-player-pause' },
  both:      { text:'Sin saldo · Pausó campañas', bg:'#FFF3CD', color:'#664D03', icon:'ti-alert-triangle' },
};


const ALERT_CONFIG = [
  { key:'a1', icon:'ti-alert-circle', title:'\uD83D\uDD34 Bajo presupuesto', bg:'#FCEBEB', border:'#F09595', headText:'#791F1F', dotColor:'#E24B4A', badgeBg:'#F7C1C1', badgeText:'#791F1F', desc:'Saldo actual menor a la inversión quincenal sugerida.', accion:'Contactar al vendor para revisar inversión y cargar saldo.' },
  { key:'a2', icon:'ti-trending-down', title:'📉 Caída de inversión >50%', bg:'#FAEEDA', border:'#EF9F27', headText:'#633806', dotColor:'#BA7517', badgeBg:'#FAC775', badgeText:'#633806', desc:'La inversión cayó más del 50% vs. la semana anterior.', accion:'Investigar causa: falta de saldo, campañas pausadas, problemas técnicos.' },
  { key:'a3', icon:'ti-building-off', title:'🏨 Caída de hoteles activos', bg:'#E6F1FB', border:'#85B7EB', headText:'#0C447C', dotColor:'#378ADD', badgeBg:'#B5D4F4', badgeText:'#0C447C', desc:'Menos hoteles activos que la semana anterior.', accion:'Verificar qué hoteles desactivaron campañas.' },
  { key:'a4', icon:'ti-cash', title:'⚠️ Con saldo, sin campañas', bg:'#E1F5EE', border:'#5DCAA5', headText:'#085041', dotColor:'#1D9E75', badgeBg:'#9FE1CB', badgeText:'#085041', desc:'El vendor tiene presupuesto pero sin campañas activas.', accion:'Contactar para crear o activar campañas.' },
  { key:'a5', icon:'ti-pause', title:'🛑 Sin saldo, con campañas', bg:'#EEEDFE', border:'#AFA9EC', headText:'#3C3489', dotColor:'#7F77DD', badgeBg:'#CECBF6', badgeText:'#3C3489', desc:'Campañas configuradas pero sin presupuesto disponible.', accion:'Solicitar carga de saldo para que las campañas se ejecuten.' },
  { key:'a7', icon:'ti-user-plus', title:'\uD83C\uDD95 Nuevos usuarios (\u00faltima semana)', bg:'#EDE9F7', border:'#C4B5F0', headText:'#3B1FA3', dotColor:'#6D4ADE', badgeBg:'#D4C9F7', badgeText:'#3B1FA3', desc:'Hoteles incorporados en los \u00faltimos 7 d\u00edas.', accion:'Contactar para asegurarse que las campa\u00f1as est\u00e1n activas.' },
  { key:'a8', icon:'ti-cash', title:'\uD83D\uDCB0 Cargas de saldo (\u00faltima semana)', bg:'#E8EDF7', border:'#B5C4F0', headText:'#1F3FA3', dotColor:'#4A6ADE', badgeBg:'#C9D4F7', badgeText:'#1F3FA3', desc:'Cargas de saldo registradas en los \u00faltimos 7 d\u00edas.', accion:'Dar seguimiento para activar o revisar campa\u00f1as.' },
  { key:'a6', icon:'ti-ban', title:'\uD83D\uDCA4 Sin actividad', bg:'#F1EFE8', border:'#B4B2A9', headText:'#444441', dotColor:'#888780', badgeBg:'#D3D1C7', badgeText:'#444441', desc:'Vendor registrado sin saldo ni campañas.', accion:'Contactar para acompañar el onboarding.' },
];



function groupByExec(items) {
  const map = {};
  items.forEach(v => {
    if (!v.eecc || v.eecc === 'admin') return;
    if (!map[v.eecc]) map[v.eecc] = [];
    map[v.eecc].push(v);
  });
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
}

function execShort(e) { return e.split('@')[0]; }
function initials(e) { return e.split('@')[0].split('.').map(p => p[0]?.toUpperCase() || '').slice(0,2).join(''); }
function fmt(n) { return Number(n.toFixed(0)).toLocaleString('es-AR'); }

// ── CONFIG ────────────────────────────────────────────────────────────────

// ── COMPONENTS ───────────────────────────────────────────────────────────
function CausePill({ cause }) {
  if (!cause) return null;
  const c = CAUSE_LABELS[cause];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:c.bg, color:c.color, fontSize:11, fontWeight:500, padding:'2px 7px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>
      <i className={`ti ${c.icon}`} style={{ fontSize:11 }} aria-hidden="true" />
      {c.text}
    </span>
  );
}

function VendorRow({ v, alertKey, cfg, isLast }) {
  return (
    <div style={{ padding:'9px 0', borderBottom: isLast ? 'none' : '0.5px solid #ECECEC' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:cfg.dotColor, flexShrink:0 }} />
          <span style={{ fontSize:13, color:'#111111', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.name}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {alertKey === 'a1' && <>
            <span style={{ fontSize:11, color:'#555555', whiteSpace:'nowrap' }}>Saldo: <strong style={{ color:'#111111' }}>${fmt(v.saldo)}</strong></span>
            <span style={{ fontSize:11, color:'#555555', whiteSpace:'nowrap' }}>Sug: <strong style={{ color:cfg.headText }}>${fmt(v.inv_sug)}</strong></span>
            <span style={{ fontSize:11, fontWeight:600, background:cfg.badgeBg, color:cfg.badgeText, padding:'2px 7px', borderRadius:20 }}>−{v.pct}%</span>
          </>}
          {alertKey === 'a2' && <span style={{ fontSize:11, fontWeight:600, background:cfg.badgeBg, color:cfg.badgeText, padding:'2px 7px', borderRadius:20 }}>−{v.pct}%</span>}
          {alertKey === 'a3' && <>
            <span style={{ fontSize:11, color:'#555555', whiteSpace:'nowrap' }}>{v.hoteles_ant} → <strong style={{ color:cfg.headText }}>{v.hoteles_act}</strong></span>
            <span style={{ fontSize:11, fontWeight:600, background:cfg.badgeBg, color:cfg.badgeText, padding:'2px 7px', borderRadius:20 }}>−{v.diff}</span>
          </>}
          {alertKey === 'a4' && <span style={{ fontSize:11, color:'#555555', whiteSpace:'nowrap' }}>Saldo: <strong style={{ color:'#111111' }}>${fmt(v.saldo)}</strong></span>}
        </div>
      </div>

      {alertKey === 'a2' && (
        <div style={{ marginLeft:13, marginTop:7, display:'flex', alignItems:'flex-start', gap:6, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:4, alignItems:'center', background:'#F0F0F0', borderRadius:6, padding:'5px 10px', fontSize:12 }}>
            <span style={{ color:'#999999' }}>Inversión</span>
            <span style={{ color:'#111111', fontWeight:500 }}>${fmt(v.inv_ant)}</span>
            <i className="ti ti-arrow-right" style={{ fontSize:11, color:'#999999' }} aria-hidden="true" />
            <span style={{ color:'#854F0B', fontWeight:500 }}>${fmt(v.inv_act)}</span>
          </div>
          <div style={{ display:'flex', gap:4, alignItems:'center', background: v.saldo <= 50 ? '#FCEBEB' : '#F0F0F0', borderRadius:6, padding:'5px 10px', fontSize:12, border: v.saldo <= 50 ? '0.5px solid #F7C1C1' : 'none' }}>
            <i className="ti ti-wallet" style={{ fontSize:12, color: v.saldo <= 50 ? '#791F1F' : '#999999' }} aria-hidden="true" />
            <span style={{ color: v.saldo <= 50 ? '#791F1F' : '#999999' }}>Saldo</span>
            <span style={{ color: v.saldo <= 50 ? '#791F1F' : '#111111', fontWeight:500 }}>${fmt(v.saldo)}</span>
            {v.saldo <= 50 && <span style={{ fontSize:10, fontWeight:600, color:'#791F1F' }}>· agotado</span>}
          </div>
          <div style={{ display:'flex', gap:4, alignItems:'center', background: v.campanas_ant > 0 && v.campanas_act === 0 ? '#EEEDFE' : '#F0F0F0', borderRadius:6, padding:'5px 10px', fontSize:12, border: v.campanas_ant > 0 && v.campanas_act === 0 ? '0.5px solid #CECBF6' : 'none' }}>
            <i className="ti ti-speakerphone" style={{ fontSize:12, color: v.campanas_ant > 0 && v.campanas_act === 0 ? '#3C3489' : '#999999' }} aria-hidden="true" />
            <span style={{ color: v.campanas_ant > 0 && v.campanas_act === 0 ? '#3C3489' : '#999999' }}>Campañas</span>
            <span style={{ color: v.campanas_ant > 0 && v.campanas_act === 0 ? '#3C3489' : '#111111', fontWeight:500 }}>{v.campanas_ant} → {v.campanas_act}</span>
            {v.campanas_ant > 0 && v.campanas_act === 0 && <span style={{ fontSize:10, fontWeight:600, color:'#3C3489' }}>· pausadas</span>}
          </div>
          {v.cause && <CausePill cause={v.cause} />}
        </div>
      )}
    </div>
  );
}

function ExecBlock({ exec, vendors, alertKey, cfg }) {
  const ini = initials(exec);
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <div style={{ width:26, height:26, borderRadius:'50%', background:cfg.bg, border:'0.5px solid '+cfg.border+'', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:500, color:cfg.headText, flexShrink:0 }}>{ini}</div>
        <span style={{ fontSize:12, fontWeight:500, color:'#555555' }}>{execShort(exec)}</span>
        <span style={{ fontSize:11, background:cfg.badgeBg, color:cfg.badgeText, borderRadius:20, padding:'1px 7px', fontWeight:500 }}>{vendors.length}</span>
      </div>
      <div style={{ marginLeft:34, background:'#F5F5F5', borderRadius:8, padding:'0 12px' }}>
        {vendors.map((v, i) => <VendorRow key={i} v={v} alertKey={alertKey} cfg={cfg} isLast={i === vendors.length - 1} />)}
      </div>
    </div>
  );
}

function AlertCard({ cfg, items }) {
  const [open, setOpen] = useState(false);
  const grouped = useMemo(() => groupByExec(items), [items]);
  return (
    <div style={{ background:'#FFFFFF', borderRadius:12, border:'0.5px solid '+open ? cfg.border : '#ECECEC'+'', marginBottom:8, overflow:'hidden', transition:'border-color 0.15s' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', userSelect:'none', background:cfg.bg }}>
        <div style={{ width:32, height:32, borderRadius:8, background:cfg.badgeBg, border:'0.5px solid '+cfg.border+'', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <i className={`ti ${cfg.icon}`} style={{ fontSize:16, color:cfg.headText }} aria-hidden="true" />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:500, color:cfg.headText }}>{cfg.title}</div>
          <div style={{ fontSize:11, color:cfg.headText, opacity:0.65, marginTop:1 }}>
            {items.length} vendor{items.length !== 1 ? 's' : ''} · {grouped.length} ejecutivo{grouped.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ background:cfg.badgeBg, color:cfg.badgeText, fontSize:13, fontWeight:600, padding:'3px 11px', borderRadius:20, border:'0.5px solid '+cfg.border+'' }}>{items.length}</span>
          <i className="ti ti-chevron-down" style={{ fontSize:14, color:cfg.headText, opacity:0.5, transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} aria-hidden="true" />
        </div>
      </div>
      {open && (
        <div>
          <div style={{ display:'flex', borderBottom:'0.5px solid #ECECEC' }}>
            <div style={{ flex:1, padding:'10px 16px', borderRight:'0.5px solid #ECECEC' }}>
              <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.06em', color:'#999999', textTransform:'uppercase', marginBottom:4 }}>Situación</div>
              <div style={{ fontSize:12, color:'#555555', lineHeight:1.5 }}>{cfg.desc}</div>
            </div>
            <div style={{ flex:1, padding:'10px 16px' }}>
              <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.06em', color:'#999999', textTransform:'uppercase', marginBottom:4 }}>Acción</div>
              <div style={{ fontSize:12, color:'#555555', lineHeight:1.5 }}>{cfg.accion}</div>
            </div>
          </div>
          {cfg.key === 'a2' && (
            <div style={{ padding:'8px 16px', borderBottom:'0.5px solid #ECECEC', background:'#F0F0F0', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#999999' }}>Causa detectada →</span>
              {Object.entries(CAUSE_LABELS).map(([k, c]) => (
                <span key={k} style={{ display:'inline-flex', alignItems:'center', gap:4, background:c.bg, color:c.color, fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20 }}>
                  <i className={`ti ${c.icon}`} style={{ fontSize:11 }} aria-hidden="true" />{c.text}
                </span>
              ))}
            </div>
          )}
          <div style={{ padding:'12px 16px 4px' }}>
            {cfg.key === 'a7'
              ? groupByExec(items).map(function([exec, rows]) { return (
                  <div key={exec} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 0' }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'#111111' }}>{execShort(exec)}</span>
                      <span style={{ fontSize:11, color:'#999999' }}>{rows.length} hotel{rows.length !== 1 ? 'es' : ''}</span>
                    </div>
                    {rows.map(function(u, i) { return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 8px', borderRadius:6, background:'#F5F5F5', marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:500, color:'#111111', flex:1 }}>{u.name}</span>
                        <span style={{ fontSize:11, color:'#999999' }}>{u.destino}</span>
                        <span style={{ fontSize:11, color:cfg.headText, background:cfg.badgeBg, padding:'1px 6px', borderRadius:10 }}>{u.fecha}</span>
                      </div>
                    );})}
                  </div>
                );})
              : cfg.key === 'a8'
              ? groupByExec(items).map(function([exec, rows]) { return (
                  <div key={exec} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 0' }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'#111111' }}>{execShort(exec)}</span>
                      <span style={{ fontSize:11, color:'#999999' }}>{rows.length} carga{rows.length !== 1 ? 's' : ''}</span>
                    </div>
                    {rows.map(function(c, i) { return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 8px', borderRadius:6, background:'#F5F5F5', marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:500, color:'#111111', flex:1 }}>{c.name}</span>
                        <span style={{ fontSize:11, color:'#999999' }}>{c.currency} {Number(c.monto).toLocaleString('es-AR')}</span>
                        <span style={{ fontSize:11, padding:'1px 6px', borderRadius:10, background:c.status === 'ACCREDITED' ? '#D1FAE5' : '#FEF3C7', color:c.status === 'ACCREDITED' ? '#065F46' : '#92400E' }}>{c.status === 'ACCREDITED' ? 'Acreditada' : 'Facturada'}</span>
                        <span style={{ fontSize:11, color:cfg.headText, background:cfg.badgeBg, padding:'1px 6px', borderRadius:10 }}>{c.fecha}</span>
                      </div>
                    );})}
                  </div>
                );})
              : grouped.map(([exec, vendors]) => (
                  <ExecBlock key={exec} exec={exec} vendors={vendors} alertKey={cfg.key} cfg={cfg} />
                ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────
export default function STADashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterExec, setFilterExec] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  function parseNum(s) {
    if (s === null || s === undefined || s === '') return 0;
    if (typeof s === 'number') return s;
    return parseFloat(String(s).replace(',', '.')) || 0;
  }

  function fmtDate(d) {
    if (!d) return '';
    if (typeof d === 'string') return d;
    var dt = new Date(d);
    if (isNaN(dt)) return String(d);
    var months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return dt.getDate() + ' ' + months[dt.getMonth()] + ', ' + dt.getFullYear();
  }

  useEffect(function() {
    fetch("https://script.google.com/a/macros/despegar.com/s/AKfycby5ZixwD1vBWj-_8-EET6WmlSA6EXeRiumKkjbeH_hHp_wRlEMoRHibzg2pubxDMq5a/exec", { credentials: "include", mode: "cors" })
      .then(function(res) { return res.json(); })
      .then(function(json) {
        var vendors = (json.vendors || []).map(function(r) {
          return {
            id: r['external_vendor_id'] || '',
            name: r['vendor_name'] || '',
            eecc: (r['eecc'] || '').trim(),
            saldo: parseNum(r['saldo_actual']),
            campanas_ant: parseInt(r['total_campanas_activas_sem_ant']) || 0,
            campanas_act: parseInt(r['total_campanas_activas_sem_act']) || 0,
            hoteles_ant: parseInt(r['hoteles_activos_sem_ant']) || 0,
            hoteles_act: parseInt(r['hoteles_activos_sem_act']) || 0,
            inv_ant: parseNum(r['inversion_sem_ant']),
            inv_act: parseNum(r['inversion_sem_act']),
            situacion: r['situacion'] || '',
          };
        });

        var saldoInv = (json.saldoInv || []).map(function(r) {
          return {
            id: r['vendor_id'] || '',
            name: r['vendor_name'] || '',
            eecc: (r['ejecutivo'] || '').trim(),
            saldo: parseNum(r['balance_actual']),
            inv_sug: parseNum(r['inversion_sugerida_quincenal']),
          };
        });

        var nuevos = (json.nuevos || []).map(function(r) {
          return {
            fecha: fmtDate(r['fecha_creado']),
            vendor_id: r['vendor_id'] || '',
            vendor_name: r['vendor_name'] || '',
            destino: r['destino'] || '',
            ejecutivo: (r['ejecutivo'] || '').trim(),
          };
        });

        var cargas = (json.cargas || []).map(function(r) {
          return {
            fecha: fmtDate(r['fecha_creacion']),
            vendor_id: r['vendor_id'] || '',
            vendor_name: r['vendor_name'] || '',
            monto: parseNum(r['monto']),
            currency: r['currency'] || '',
            status: (r['status'] || '').toUpperCase(),
            ejecutivo: (r['ejecutivo'] || '').trim(),
          };
        });

        var alerts = { a1:[], a2:[], a3:[], a4:[], a5:[], a6:[], a7:[], a8:[] };

        saldoInv.forEach(function(v) {
          if (!v.eecc || v.eecc === 'admin') return;
          if (v.saldo < v.inv_sug) {
            alerts.a1.push(Object.assign({}, v, { pct: Math.round((v.inv_sug - v.saldo) / v.inv_sug * 100) }));
          }
        });

        vendors.forEach(function(v) {
          if (!v.eecc || v.eecc === 'admin') return;
          if (v.situacion === 'Sin saldo, con campanas activas' || v.situacion === 'Sin saldo, con campañas activas') {
            alerts.a1.push(Object.assign({}, v, { subtype:'zero', inv_sug:null, pct:null }));
          }
          if (v.inv_ant > 0 && (v.inv_ant - v.inv_act) / v.inv_ant > 0.5) {
            var pct = Math.round((v.inv_ant - v.inv_act) / v.inv_ant * 100);
            var sinSaldo = v.saldo <= 50;
            var pausoCampanas = v.campanas_ant > 0 && v.campanas_act === 0;
            var cause = sinSaldo && pausoCampanas ? 'both' : sinSaldo ? 'no_saldo' : pausoCampanas ? 'campanas' : null;
            alerts.a2.push(Object.assign({}, v, { pct: pct, cause: cause }));
          }
          if (v.hoteles_act < v.hoteles_ant) alerts.a3.push(Object.assign({}, v, { diff: v.hoteles_ant - v.hoteles_act }));
          if (v.situacion === 'Con saldo, sin campanas activas' || v.situacion === 'Con saldo, sin campañas activas') alerts.a4.push(v);
          if (v.situacion === 'Sin saldo, con campanas activas' || v.situacion === 'Sin saldo, con campañas activas') alerts.a5.push(v);
          if (v.situacion === 'Sin saldo ni actividad') alerts.a6.push(v);
        });

        nuevos.forEach(function(u) {
          if (!u.ejecutivo || u.ejecutivo === 'admin') return;
          alerts.a7.push({ name: u.vendor_name, eecc: u.ejecutivo, fecha: u.fecha, destino: u.destino });
        });

        cargas.forEach(function(c) {
          if (!c.ejecutivo || c.ejecutivo === 'admin') return;
          alerts.a8.push({ name: c.vendor_name, eecc: c.ejecutivo, fecha: c.fecha, monto: c.monto, currency: c.currency, status: c.status });
        });

        setData({ alerts: alerts, vendorCount: vendors.length });
        setLoading(false);
      })
      .catch(function(err) {
        setError('Error al cargar datos: ' + err.message);
        setLoading(false);
      });
  }, []);

  var alerts = data ? data.alerts : {};
  var vendorCount = data ? data.vendorCount : 0;

  var allExecs = useMemo(function() {
    var set = new Set();
    Object.values(alerts).forEach(function(list) {
      list.forEach(function(v) { if (v.eecc && v.eecc !== 'admin') set.add(v.eecc); });
    });
    return Array.from(set).sort();
  }, [alerts]);

  var filtered = useMemo(function() {
    if (filterExec === 'all') return alerts;
    var out = {};
    Object.entries(alerts).forEach(function(entry) {
      out[entry[0]] = entry[1].filter(function(v) { return v.eecc === filterExec; });
    });
    return out;
  }, [alerts, filterExec]);

  var totalVendors = Object.values(filtered).reduce(function(s, a) { return s + a.length; }, 0);
  var activeTypes = Object.values(filtered).filter(function(a) { return a.length > 0; }).length;
  var execCount = new Set(Object.values(filtered).flat().map(function(v) { return v.eecc; }).filter(function(e) { return e && e !== 'admin'; })).size;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ textAlign:'center', color:'#999999' }}>
        <i className="ti ti-loader" style={{ fontSize:36, display:'block', marginBottom:12 }} aria-hidden="true"/>
        <div style={{ fontSize:13 }}>Cargando datos del sheet...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Inter, -apple-system, BlinkMacSystemFont, sans-serif', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:360, color:'#999999' }}>
        <i className="ti ti-alert-circle" style={{ fontSize:36, display:'block', marginBottom:12, color:'#E24B4A' }} aria-hidden="true"/>
        <div style={{ fontSize:13, marginBottom:8 }}>{error}</div>
        <div style={{ fontSize:11 }}>Asegurate de estar logueada con tu cuenta Despegar y que el Web App tenga permisos.</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:'Inter, -apple-system, BlinkMacSystemFont, sans-serif', background:'#F0F0F0', minHeight:'100vh' }}>
      <div style={{ background:'#FFFFFF', borderBottom:'0.5px solid #ECECEC', padding:'14px 20px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'#F5F5F5', border:'0.5px solid #ECECEC', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="ti ti-chart-bar" style={{ fontSize:17, color:'#555555' }} aria-hidden="true"/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:'#111111', lineHeight:1.2 }}>Sponsored Travel Ads</div>
              <div style={{ fontSize:11, color:'#999999' }}>{vendorCount} vendors en el sheet</div>
            </div>
          </div>
          <button onClick={function() { setShowFilter(function(s) { return !s; }); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12, fontWeight:600, borderRadius:8, border: filterExec !== 'all' ? '1.5px solid #3B82F6' : '1.5px solid #E0E0E0', background: filterExec !== 'all' ? '#EFF6FF' : '#F5F5F5', color: filterExec !== 'all' ? '#1D4ED8' : '#111111', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
            <i className="ti ti-filter" style={{ fontSize:13 }} aria-hidden="true"/>
            {filterExec === 'all' ? 'Ejecutivo' : execShort(filterExec)}
            {filterExec !== 'all' && (
              <i className="ti ti-x" style={{ fontSize:11 }} onClick={function(e) { e.stopPropagation(); setFilterExec('all'); setShowFilter(false); }} aria-hidden="true"/>
            )}
          </button>
        </div>
        {showFilter && (
          <div style={{ marginTop:10, paddingTop:10, borderTop:'0.5px solid #ECECEC', display:'flex', gap:5, flexWrap:'wrap' }}>
            {['all', ...allExecs].map(function(exec) {
              return (
                <button key={exec} onClick={function() { setFilterExec(exec); setShowFilter(false); }} style={{ fontSize:11, fontWeight:500, padding:'4px 10px', borderRadius:20, cursor:'pointer', border:'0.5px solid', borderColor: filterExec === exec ? '#111111' : '#E0E0E0', background: filterExec === exec ? '#111111' : 'transparent', color: filterExec === exec ? '#FFFFFF' : '#555555' }}>
                  {exec === 'all' ? 'Todos' : execShort(exec)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ maxWidth:720, margin:'0 auto', padding:'16px 16px 48px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:8, marginBottom:18 }}>
          {[
            { label:'Tipos de alerta', value:activeTypes, icon:'ti-bell' },
            { label:'Vendors afectados', value:totalVendors, icon:'ti-building' },
            { label:'Ejecutivos', value:execCount, icon:'ti-users' },
          ].map(function(m) {
            return (
              <div key={m.label} style={{ background:'#F5F5F5', borderRadius:'8px', padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                  <i className={"ti " + m.icon} style={{ fontSize:13, color:'#999999' }} aria-hidden="true"/>
                  <span style={{ fontSize:11, color:'#555555' }}>{m.label}</span>
                </div>
                <div style={{ fontSize:22, fontWeight:500, color:'#111111', lineHeight:1 }}>{m.value}</div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.07em', color:'#999999', textTransform:'uppercase', marginBottom:10 }}>Alertas semanales</div>

        {ALERT_CONFIG.map(function(cfg) {
          var items = filtered[cfg.key] || [];
          if (!items.length) return null;
          return <AlertCard key={cfg.key} cfg={cfg} items={items}/>;
        })}

        {!totalVendors && !loading && (
          <div style={{ textAlign:'center', padding:'56px 0', color:'#999999' }}>
            <i className="ti ti-circle-check" style={{ fontSize:36, display:'block', marginBottom:10 }} aria-hidden="true"/>
            <div style={{ fontSize:13 }}>Sin alertas para este ejecutivo</div>
          </div>
        )}
      </div>
    </div>
  );
}
