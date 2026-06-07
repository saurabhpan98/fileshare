import { Peer } from 'peerjs';

const CHUNK_SIZE = 16 * 1024;

export function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class PeerConnection {
  constructor(onStateChange, onFileReceived, onProgress) {
    this.peer = null;
    this.conn = null;
    this.onStateChange = onStateChange;
    this.onFileReceived = onFileReceived;
    this.onProgress = onProgress;
    this.receiveBuffers = new Map();
    this.receiveExpected = new Map();
    this.currentReceiveId = null;
  }

  /* ─── SENDER: create PIN and wait for receiver ─── */
  async startSender(pin) {
    return new Promise((resolve, reject) => {
      const peerId = `filesync-s-${pin}`;
      this.peer = new Peer(peerId, { debug: 0 });

      this.peer.on('open', () => {
        this.onStateChange('waiting');
        resolve(pin);
      });

      this.peer.on('connection', (conn) => {
        this.conn = conn;
        this._setupConnection();
        conn.on('open', () => this.onStateChange('connected'));
      });

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') reject(new Error('PIN in use — try again'));
        else { console.error(err); reject(err); }
      });

      setTimeout(() => {
        if (this.peer && !this.conn) { this.peer.destroy(); reject(new Error('Timed out waiting')); }
      }, 180000);
    });
  }

  /* ─── RECEIVER: connect to sender's PIN ─── */
  async startReceiver(pin) {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(`filesync-r-${generatePin()}`, { debug: 0 });

      this.peer.on('open', () => {
        this.onStateChange('connecting');
        const conn = this.peer.connect(`filesync-s-${pin}`, { reliable: true, serialization: 'binary' });
        this.conn = conn;
        this._setupConnection();
        conn.on('open', () => { this.onStateChange('connected'); resolve(); });
        conn.on('error', () => reject(new Error('Connection failed')));
      });

      this.peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') reject(new Error('Sender not found'));
        else { console.error(err); reject(err); }
      });

      setTimeout(() => {
        if (this.peer?.open && !this.conn?.open) { this.peer.destroy(); reject(new Error('Timed out')); }
      }, 30000);
    });
  }

  async sendFiles(fileList) {
    if (!this.conn?.open) throw new Error('Not connected');
    for (const file of fileList) this._sendFile(file, crypto.randomUUID());
  }

  disconnect() {
    if (this.conn) { try { this.conn.close(); } catch(_){} this.conn = null; }
    if (this.peer) { try { this.peer.destroy(); } catch(_){} this.peer = null; }
    this.receiveBuffers.clear(); this.receiveExpected.clear();
    this.currentReceiveId = null; this.onStateChange('disconnected');
  }

  _setupConnection() {
    this.conn.on('close', () => this.onStateChange('disconnected'));
    this.conn.on('error', () => this.onStateChange('error'));
    this.conn.on('data', (d) => this._handleData(d));
  }

  _handleData(data) {
    if (typeof data === 'string') {
      let msg; try { msg = JSON.parse(data); } catch { return; }
      if (msg.type === 'file-start') {
        this.currentReceiveId = msg.fileId;
        this.receiveBuffers.set(msg.fileId, []);
        this.receiveExpected.set(msg.fileId, { total: msg.fileSize, name: msg.fileName, mimeType: msg.mimeType || 'application/octet-stream' });
        this.onProgress(msg.fileId, { progress: 0, status: 'receiving' });
      } else if (msg.type === 'file-end') {
        const chunks = this.receiveBuffers.get(msg.fileId);
        const exp = this.receiveExpected.get(msg.fileId);
        if (chunks && exp) {
          this.onFileReceived(new File([new Blob(chunks, { type: exp.mimeType })], exp.name, { type: exp.mimeType }));
        }
        this.receiveBuffers.delete(msg.fileId); this.receiveExpected.delete(msg.fileId);
        this.currentReceiveId = null; this.onProgress(msg.fileId, { progress: 100, status: 'received' });
      }
    } else if (data instanceof ArrayBuffer) {
      if (this.currentReceiveId && this.receiveBuffers.has(this.currentReceiveId)) {
        this.receiveBuffers.get(this.currentReceiveId).push(data); this._updateProgress();
      }
    } else if (data instanceof Blob) {
      data.arrayBuffer().then((ab) => {
        if (this.currentReceiveId && this.receiveBuffers.has(this.currentReceiveId)) {
          this.receiveBuffers.get(this.currentReceiveId).push(ab); this._updateProgress();
        }
      });
    }
  }

  _updateProgress() {
    if (!this.currentReceiveId) return;
    const exp = this.receiveExpected.get(this.currentReceiveId);
    if (!exp) return;
    const recv = this.receiveBuffers.get(this.currentReceiveId).reduce((s, c) => s + c.byteLength, 0);
    this.onProgress(this.currentReceiveId, { progress: Math.min((recv / exp.total) * 100, 100), status: 'receiving' });
  }

  _sendFile(file, fileId) {
    this.conn.send(JSON.stringify({ type: 'file-start', fileId, fileName: file.name, fileSize: file.size, mimeType: file.type }));
    this.onProgress(fileId, { progress: 0, status: 'sending' });
    file.arrayBuffer().then((ab) => {
      let offset = 0;
      const send = () => {
        if (offset >= ab.byteLength) {
          this.conn.send(JSON.stringify({ type: 'file-end', fileId }));
          this.onProgress(fileId, { progress: 100, status: 'sent' }); return;
        }
        const end = Math.min(offset + CHUNK_SIZE, ab.byteLength);
        this.conn.send(ab.slice(offset, end)); offset = end;
        this.onProgress(fileId, { progress: (offset / ab.byteLength) * 100, status: 'sending' });
        setTimeout(send, 3);
      };
      send();
    });
  }
}
