import React, { useState, useCallback, useRef } from 'react';
import { PeerManager } from './peerManager';
import { QRCodeSVG } from 'qrcode.react';

/* ─── Icons ─── */
const I = {
  Send: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Download: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Copy: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Check: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Upload: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Wifi: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  Shield: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  PhonePc: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="16" rx="2"/><line x1="18" y1="8" x2="22" y2="8"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="18" y1="16" x2="22" y2="16"/><rect x="16" y="18" width="8" height="4" rx="1"/></svg>,
  File: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Trash: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  ArrowLeft: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Link: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

/* ─── Helpers ─── */
function fmtSize(b) {
  if (b === 0) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
}

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
}

/* ─── Small Components ─── */

const StatusBadge = ({ state }) => {
  const c = {
    disconnected: { l: 'Disconnected', bg: 'bg-gray-500/20', t: 'text-gray-400', border: 'border-gray-500/30' },
    'offer-ready': { l: 'Offer Ready', bg: 'bg-amber-500/20', t: 'text-amber-400', border: 'border-amber-500/30' },
    'answer-ready': { l: 'Answer Ready', bg: 'bg-amber-500/20', t: 'text-amber-400', border: 'border-amber-500/30' },
    connecting: { l: 'Connecting...', bg: 'bg-blue-500/20', t: 'text-blue-400', border: 'border-blue-500/30' },
    connected: { l: 'Connected', bg: 'bg-green-500/20', t: 'text-green-400', border: 'border-green-500/30' },
    error: { l: 'Error', bg: 'bg-red-500/20', t: 'text-red-400', border: 'border-red-500/30' },
  };
  const { l, bg, t, border } = c[state] || c.disconnected;
  const dot = state === 'connected' ? 'bg-green-400 animate-pulse' : state === 'connecting' ? 'bg-blue-400 animate-pulse' : state === 'error' ? 'bg-red-400' : 'bg-gray-400';
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${bg} ${t} ${border}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />{l}
    </span>
  );
};

const ProgressBar = ({ progress, color = 'blue' }) => {
  const g = color === 'green' ? 'from-green-500 to-emerald-400' : color === 'red' ? 'from-red-500 to-pink-400' : 'from-blue-500 to-cyan-400';
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${g} rounded-full transition-all duration-300`} style={{ width: `${Math.min(progress, 100)}%` }} />
    </div>
  );
};

const CopyBlock = ({ label, text }) => {
  const [done, setDone] = useState(false);
  const handleCopy = () => { copyText(text); setDone(true); setTimeout(() => setDone(false), 2000); };
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xs font-mono text-cyan-300 truncate">{text}</p>
      </div>
      <button onClick={handleCopy} className={`p-2 rounded-lg transition-all shrink-0 ${done ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/15'}`}>
        {done ? <I.Check /> : <I.Copy />}
      </button>
    </div>
  );
};

const QRBox = ({ data }) => (
  <div className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
    <div className="bg-white p-3 rounded-xl">
      <QRCodeSVG value={data} size={180} level="M" bgColor="#ffffff" fgColor="#0f172a" />
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App() {
  const [step, setStep] = useState('home');        // home | send-offer | receive-input | send-input | connected
  const [peerState, setPeerState] = useState('disconnected');
  const [offerCode, setOfferCode] = useState('');
  const [answerCode, setAnswerCode] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [transfers, setTransfers] = useState({});   // id -> { name, size, progress, status }
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [showTab, setShowTab] = useState('send');   // send | receive
  const [showQR, setShowQR] = useState(false);
  const [toast, setToast] = useState(null);

  const peerRef = useRef(null);
  const fileRef = useRef(null);
  const transferIdRef = useRef(0);

  const toast_ = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const initPeer = useCallback(() => {
    if (peerRef.current) peerRef.current.disconnect();
    const pm = new PeerManager(
      (s) => { setPeerState(s); if (s === 'connected') setStep('connected'); if (s === 'error') toast_('Connection failed', 'error'); },
      (file) => {
        const id = ++transferIdRef.current;
        setReceivedFiles(p => [{ id, name: file.name, size: file.size, type: file.type, blob: file, ts: Date.now() }, ...p]);
        toast_(`Received: ${file.name}`, 'success');
      },
      (fileId, { progress, status }) => {
        setTransfers(p => ({ ...p, [fileId]: { ...(p[fileId] || {}), progress, status } }));
      }
    );
    peerRef.current = pm;
    return pm;
  }, []);

  const doCreateOffer = async () => {
    setShowQR(false);
    const pm = initPeer();
    try {
      const code = await pm.createOffer();
      setOfferCode(code);
      setStep('send-offer');
    } catch (e) { toast_('Failed to create offer', 'error'); }
  };

  const doCreateAnswer = async () => {
    if (!inputVal.trim()) return;
    setShowQR(false);
    const pm = initPeer();
    try {
      const code = await pm.createAnswer(inputVal.trim());
      setAnswerCode(code);
      setStep('send-input');
    } catch (e) { toast_('Invalid offer code', 'error'); }
  };

  const doAcceptAnswer = async () => {
    if (!inputVal.trim()) return;
    const pm = peerRef.current;
    if (!pm) return;
    try {
      await pm.acceptAnswer(inputVal.trim());
      toast_('Connecting…', 'info');
    } catch (e) { toast_('Failed to connect', 'error'); }
  };

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const doSendFiles = async () => {
    const pm = peerRef.current;
    if (!pm || selectedFiles.length === 0) return;
    for (const f of selectedFiles) {
      const id = ++transferIdRef.current;
      setTransfers(p => ({ ...p, [id]: { name: f.name, size: f.size, progress: 0, status: 'sending' } }));
      try {
        await pm.sendFiles([f]);
      } catch (e) {
        setTransfers(p => ({ ...p, [id]: { ...(p[id] || {}), status: 'error' } }));
      }
    }
  };

  const doDownload = (rf) => {
    const url = URL.createObjectURL(rf.blob);
    const a = document.createElement('a');
    a.href = url; a.download = rf.name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const doRemoveReceived = (id) => setReceivedFiles(p => p.filter(f => f.id !== id));

  const doReset = () => {
    if (peerRef.current) { peerRef.current.disconnect(); peerRef.current = null; }
    setStep('home'); setPeerState('disconnected');
    setOfferCode(''); setAnswerCode(''); setInputVal('');
    setSelectedFiles([]); setTransfers({}); setReceivedFiles([]); setShowQR(false);
  };

  const doBack = () => {
    if (peerRef.current) { peerRef.current.disconnect(); peerRef.current = null; }
    setStep('home'); setPeerState('disconnected');
    setOfferCode(''); setAnswerCode(''); setInputVal(''); setShowQR(false);
  };

  const compact = (code) => { try { return JSON.stringify(JSON.parse(code)); } catch { return code; } };

  const activeCount = Object.values(transfers).filter(t => t.status === 'sending' || t.status === 'receiving').length;

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 text-white relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium animate-fade-in shadow-lg ${
          toast.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
          toast.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="relative z-10 max-w-xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 text-white">
              <I.Wifi />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">FileSync</h1>
          </div>
          <p className="text-white/50 text-sm">Secure peer-to-peer file transfer</p>
          <div className="flex justify-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-white/40"><I.Shield /> Encrypted</span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-white/40"><I.PhonePc /> Phone ↔ PC</span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-white/40">No server</span>
          </div>
        </header>

        {/* Nav back + status */}
        {step !== 'home' && (
          <div className="flex items-center justify-between mb-6">
            {step !== 'connected' ? (
              <button onClick={doBack} className="text-white/60 hover:text-white transition-colors flex items-center gap-1 text-sm">
                <I.ArrowLeft /> Back
              </button>
            ) : <div />}
            <StatusBadge state={peerState} />
            {step === 'connected' && (
              <button onClick={doReset} className="btn-danger text-sm flex items-center gap-1"><I.X /> Disconnect</button>
            )}
          </div>
        )}

        {/* ═══════════════ HOME ═══════════════ */}
        {step === 'home' && (
          <div className="animate-slide-up space-y-6">
            <div className="glass p-6 sm:p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Share Files Directly</h2>
              <p className="text-white/50 text-sm mb-6">Transfer files between devices on the same WiFi. No uploads, no cloud — direct peer-to-peer.</p>

              {/* Tab switcher */}
              <div className="flex bg-white/5 rounded-xl p-1 mb-6 max-w-xs mx-auto">
                <button
                  onClick={() => setShowTab('send')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showTab === 'send' ? 'bg-blue-500/20 text-blue-400' : 'text-white/50 hover:text-white/70'}`}
                >Send</button>
                <button
                  onClick={() => setShowTab('receive')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showTab === 'receive' ? 'bg-blue-500/20 text-blue-400' : 'text-white/50 hover:text-white/70'}`}
                >Receive</button>
              </div>

              {showTab === 'send' ? (
                <button onClick={doCreateOffer} className="btn-primary w-full flex items-center justify-center gap-2">
                  <I.Send /> Create Offer Code
                </button>
              ) : (
                <button onClick={() => { initPeer(); setStep('receive-input'); }} className="btn-primary w-full flex items-center justify-center gap-2">
                  <I.Download /> I Have an Offer Code
                </button>
              )}
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { n: '1', t: 'Create', d: 'Generate a code' },
                { n: '2', t: 'Scan / Paste', d: 'Other device connects' },
                { n: '3', t: 'Transfer', d: 'Direct P2P' },
              ].map(x => (
                <div key={x.n} className="glass glass-hover p-4 text-center">
                  <div className="w-8 h-8 mx-auto mb-2 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">{x.n}</div>
                  <p className="text-sm font-medium text-white/80">{x.t}</p>
                  <p className="text-xs text-white/40 mt-0.5">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ SEND — Offer Ready ═══════════════ */}
        {step === 'send-offer' && (
          <div className="animate-slide-up space-y-6">
            <div className="glass p-6">
              <h3 className="text-lg font-semibold mb-1">Share Your Offer Code</h3>
              <p className="text-white/50 text-sm mb-4">Show the QR code or share the text code with the receiving device.</p>
              <QRBox data={compact(offerCode)} />
              <div className="mt-4">
                <CopyBlock label="Offer Code" text={offerCode} />
              </div>
            </div>

            <div className="glass p-6">
              <h3 className="text-lg font-semibold mb-1">Paste the Answer Code</h3>
              <p className="text-white/50 text-sm mb-4">The receiver will generate an answer code — paste it here to connect.</p>
              <textarea
                value={inputVal} onChange={e => setInputVal(e.target.value)}
                placeholder="Paste answer code here…"
                className="input-field font-mono text-xs h-24 resize-none"
              />
              <button onClick={doAcceptAnswer} disabled={!inputVal.trim()} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                <I.Link /> Connect
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ RECEIVE — Input Offer ═══════════════ */}
        {step === 'receive-input' && (
          <div className="animate-slide-up space-y-6">
            <div className="glass p-6">
              <h3 className="text-lg font-semibold mb-1">Enter the Offer Code</h3>
              <p className="text-white/50 text-sm mb-4">Paste the code from the sending device, or scan their QR code.</p>
              <textarea
                value={inputVal} onChange={e => setInputVal(e.target.value)}
                placeholder="Paste offer code here…"
                className="input-field font-mono text-xs h-24 resize-none"
              />
              <button onClick={doCreateAnswer} disabled={!inputVal.trim()} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                <I.Send /> Generate Answer Code
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ SEND-INPUT — Answer Ready ═══════════════ */}
        {step === 'send-input' && (
          <div className="animate-slide-up space-y-6">
            <div className="glass p-6">
              <h3 className="text-lg font-semibold mb-1">Share Your Answer Code</h3>
              <p className="text-white/50 text-sm mb-4">Show the QR code or share the text code with the sending device.</p>
              <QRBox data={compact(answerCode)} />
              <div className="mt-4">
                <CopyBlock label="Answer Code" text={answerCode} />
              </div>
              <p className="text-center text-xs text-white/40 mt-4">Waiting for the sender to connect…</p>
            </div>
          </div>
        )}

        {/* ═══════════════ CONNECTED ═══════════════ */}
        {step === 'connected' && (
          <div className="animate-slide-up space-y-6">
            {/* Active transfers count */}
            {activeCount > 0 && (
              <div className="glass p-4 border-blue-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-300">{activeCount} transfer{activeCount > 1 ? 's' : ''} active</span>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                </div>
                <div className="space-y-3">
                  {Object.entries(transfers).filter(([, t]) => t.status === 'sending' || t.status === 'receiving').map(([id, t]) => (
                    <div key={id}>
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span className="truncate mr-2">{t.name}</span>
                        <span className="shrink-0">{Math.round(t.progress)}%</span>
                      </div>
                      <ProgressBar progress={t.progress} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Send panel */}
            <div className="glass p-6">
              <h3 className="text-lg font-semibold mb-4">Send Files</h3>
              <div
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-blue-500/30 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" multiple onChange={onFiles} className="hidden" />
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                  <I.Upload />
                </div>
                <p className="text-sm text-white/70 mb-1">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected` : 'Tap to select files'}
                </p>
                <p className="text-xs text-white/40">
                  {selectedFiles.length > 0 ? fmtSize(selectedFiles.reduce((s, f) => s + f.size, 0)) : 'Any file type, any size'}
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5 border border-white/5">
                      <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 shrink-0"><I.File className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-white/40">{fmtSize(f.size)}</p>
                      </div>
                    </div>
                  ))}
                  <button onClick={doSendFiles} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                    <I.Send /> Send {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                  </button>
                </div>
              )}

              {/* Transfer history */}
              {Object.keys(transfers).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-white/60 mb-2">Transfer History</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
                    {Object.entries(transfers).reverse().map(([id, t]) => (
                      <div key={id} className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5 border border-white/5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          t.status === 'sent' || t.status === 'received' ? 'bg-green-500/20 text-green-400' :
                          t.status === 'error' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {t.status === 'sent' ? <I.Check className="w-4 h-4" /> :
                           t.status === 'received' ? <I.Download className="w-4 h-4" /> :
                           t.status === 'error' ? <I.X className="w-4 h-4" /> :
                           <I.Send className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          <p className="text-xs text-white/40">{fmtSize(t.size)}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          t.status === 'sent' || t.status === 'received' ? 'bg-green-500/20 text-green-400' :
                          t.status === 'error' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {t.status === 'sent' ? 'Sent ✓' : t.status === 'received' ? 'Received ✓' : t.status === 'error' ? 'Failed' : `${Math.round(t.progress)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Received files */}
            {receivedFiles.length > 0 && (
              <div className="glass p-6">
                <h3 className="text-lg font-semibold mb-4">Received Files</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                  {receivedFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400 shrink-0">
                        <I.Download className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-white/40">{fmtSize(f.size)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => doDownload(f)} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1">
                          <I.Download className="w-4 h-4" /> Save
                        </button>
                        <button onClick={() => doRemoveReceived(f.id)} className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-white/40 transition-all">
                          <I.Trash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Connecting state */}
        {(peerState === 'connecting' || peerState === 'new') && (
          <div className="animate-fade-in glass p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Connecting…</h3>
            <p className="text-white/50 text-sm">Establishing peer-to-peer connection</p>
          </div>
        )}

        {/* Error state */}
        {peerState === 'error' && (
          <div className="animate-fade-in glass p-8 text-center border-red-500/30">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-2xl">⚠️</div>
            <h3 className="text-lg font-semibold mb-2 text-red-400">Connection Error</h3>
            <p className="text-white/50 text-sm mb-6">Something went wrong. Please try again.</p>
            <button onClick={doReset} className="btn-primary">Start Over</button>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 pb-6">
          <p className="text-xs text-white/30">Files transfer directly via WebRTC • No data stored or uploaded</p>
        </footer>
      </div>
    </div>
  );
}
