class FunShowEventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener, scope) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push({ listener, scope, once: false });
    }

    once(event, listener, scope) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push({ listener, scope, once: true });
    }

    off(event, listener) {
        if (!event) {
            // Remove all listeners for all events
            this.events = {};
            return;
        }
        
        if (!this.events[event]) return;
        
        if (!listener) {
            // Remove all listeners for this event
            delete this.events[event];
            return;
        }
        
        this.events[event] = this.events[event].filter(l => l.listener !== listener);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        
        const listeners = this.events[event].slice(); // Create a copy to avoid issues while removing listeners
        
        listeners.forEach(l => {
            l.listener.call(l.scope, data);
            
            if (l.once) {
                // Remove the listener if it was registered with 'once'
                this.off(event, l.listener);
            }
        });
    }
}