export class LiveService {
  constructor(onDataReceived) {
    // If running locally, this could be http://localhost:8000, 
    // or the Render URL if deployed.
    this.API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    this.WS_URL = this.API_URL.replace("http://", "ws://").replace("https://", "wss://");
    
    this.onDataReceived = onDataReceived;
    this.ws = null;
    this.intentionalClose = false;
    this.reconnectTimer = null;
  }

  async fetchCurrentState() {
    try {
      const response = await fetch(`${this.API_URL}/current-state`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching current state:", error);
      return null;
    }
  }

  connect() {
    this.intentionalClose = false;
    this.ws = new WebSocket(`${this.WS_URL}/live`);
    
    this.ws.onopen = () => {
      console.log("WebSocket connected to live stream.");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onDataReceived) {
          this.onDataReceived(data);
        }
      } catch (e) {
        console.error("Error parsing websocket message:", e);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected.");
      if (!this.intentionalClose) {
        console.log("Reconnecting in 5 seconds...");
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (this.ws) {
        this.ws.close();
      }
    };
  }

  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
