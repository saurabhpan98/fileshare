const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
const CHUNK_SIZE = 16 * 1024;

export class PeerManager {
  constructor(onStateChange, onFileReceived, onProgress) {
    this.pc = null; this.dc = null;
    this.onStateChange = onStateChange; this.onFileReceived = onFileReceived; this.onProgress = onProgress;
    this.receiveBuffers = new Map(); this.receiveExpected = new Map(); this.currentReceiveId = null;
  }

  async createOffer() {
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this._setupPeerEvents();
    this.dc = this.pc.createDataChannel('fileshare', { ordered: true });
    this._setupChannelEvents(this.dc);
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this._waitICE();
    this.onStateChange('offer-ready');
    return JSON.stringify(this.pc.localDescription);
  }

  async createAnswer(offerJSON) {
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this._setupPeerEvents();
    this.pc.ondatachannel = (e) => { this.dc = e.channel; this._setupChannelEvents(this.dc); };
    const offer = JSON.parse(offerJSON);
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this._waitICE();
    this.onStateChange('answer-ready');
    return JSON.stringify(this.pc.localDescription);
  }

  async acceptAnswer(answerJSON) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(answerJSON)));
  }

  async sendFiles(fileList) {
    if (!this.dc || this.dc.readyState !== 'open') throw new Error('Channel not open');
    for (const file of fileList) { const id = crypto.randomUUID(); this._sendFile(file, id); }
  }

  disconnect() {
    if (this.dc) { try { this.dc.close(); } catch(_){} this.dc = null; }
    if (this.pc) { try { this.pc.close(); } catch(_){} this.pc = null; }
    this.receiveBuffers.clear(); this.receiveExpected.clear();
    this.currentReceiveId = null; this.onStateChange('disconnected');
  }
  getState() { return this.pc ? (this.pc.connectionState || 'disconnected') : 'disconnected'; }

  _setupPeerEvents() {
    this.pc.onconnectionstatechange = () => {
      const s = this.pc.connectionState;
      if (s === 'connected') this.onStateChange('connected');
      else if (['disconnected','failed','closed'].includes(s)) this.onStateChange('disconnected');
      else if (s === 'connecting') this.onStateChange('connecting');
    };
  }

  _setupChannelEvents(ch) {
    ch.onopen = () => this.onStateChange('connected');
    ch.onclose = () => this.onStateChange('disconnected');
    ch.onerror = () => this.onStateChange('error');
    ch.onmessage = (e) => this._handleMsg(e);
  }

  _handleMsg(event) {
    if (typeof event.data === 'string') {
      let msg; try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.type === 'file-start') {
        this.currentReceiveId = msg.fileId;
        this.receiveBuffers.set(msg.fileId, []);
        this.receiveExpected.set(msg.fileId, { total: msg.fileSize, name: msg.fileName, mimeType: msg.mimeType || 'application/octet-stream' });
        this.onProgress(msg.fileId, { progress: 0, status: 'receiving' });
      } else if (msg.type === 'file-end') {
        const chunks = this.receiveBuffers.get(msg.fileId);
        const exp = this.receiveExpected.get(msg.fileId);
        if (chunks && exp) {
          const blob = new Blob(chunks, { type: exp.mimeType });
          this.onFileReceived(new File([blob], exp.name, { type: exp.mimeType }));
        }
        this.receiveBuffers.delete(msg.fileId); this.receiveExpected.delete(msg.fileId);
        this.currentReceiveId = null;
        this.onProgress(msg.fileId, { progress: 100, status: 'received' });
      }
    } else if (event.data instanceof ArrayBuffer) {
      if (this.currentReceiveId && this.receiveBuffers.has(this.currentReceiveId)) {
        this.receiveBuffers.get(this.currentReceiveId).push(event.data); this._updateProgress();
      }
    } else if (event.data instanceof Blob) {
      event.data.arrayBuffer().then((ab) => {
        if (this.currentReceiveId && this.receiveBuffers.has(this.currentReceiveId)) {
          this.receiveBuffers.get(this.currentReceiveId).push(ab); this._updateProgress();
        }
      });
    }
  }

  _updateProgress() {
    if (this.currentReceiveId) {
      const exp = this.receiveExpected.get(this.currentReceiveId);
      if (exp) {
        const recv = this.receiveBuffers.get(this.currentReceiveId).reduce((s, c) => s + c.byteLength, 0);
        this.onProgress(this.currentReceiveId, { progress: Math.min((recv / exp.total) * 100, 100), status: 'receiving' });
      }
    }
  }

  _sendFile(file, fileId) {
    this.dc.send(JSON.stringify({ type: 'file-start', fileId, fileName: file.name, fileSize: file.size, mimeType: file.type }));
    this.onProgress(fileId, { progress: 0, status: 'sending' });
    file.arrayBuffer().then((ab) => {
      let offset = 0;
      const sendChunk = () => {
        if (offset >= ab.byteLength) {
          this.dc.send(JSON.stringify({ type: 'file-end', fileId }));
          this.onProgress(fileId, { progress: 100, status: 'sent' }); return;
        }
        const end = Math.min(offset + CHUNK_SIZE, ab.byteLength);
        this.dc.send(ab.slice(offset, end)); offset = end;
        this.onProgress(fileId, { progress: Math.min((offset / ab.byteLength) * 100, 100), status: 'sending' });
        setTimeout(sendChunk, 3);
      };
      sendChunk();
    });
  }

  _waitICE() {
    return new Promise((resolve) => {
      if (this.pc.iceGatheringState === 'complete') { resolve(); return; }
      const h = () => { if (this.pc.iceGatheringState === 'complete') { this.pc.removeEventListener('icegatheringstatechange', h); resolve(); } };
      this.pc.addEventListener('icegatheringstatechange', h);
      setTimeout(resolve, 6000);
    });
  }
}
