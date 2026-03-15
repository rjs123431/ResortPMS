// Initialize ABP compatibility layer for event system
export const initAbpEvents = () => {
  if (typeof window !== 'undefined') {
    if (!(window as any).abp) {
      (window as any).abp = {};
    }
    
    if (!(window as any).abp.event) {
      // Simple event emitter implementation
      const events: { [key: string]: Function[] } = {};
      
      (window as any).abp.event = {
        on: (eventName: string, callback: Function) => {
          if (!events[eventName]) {
            events[eventName] = [];
          }
          events[eventName].push(callback);
        },
        off: (eventName: string, callback: Function) => {
          if (events[eventName]) {
            events[eventName] = events[eventName].filter(cb => cb !== callback);
          }
        },
        trigger: (eventName: string, ...args: any[]) => {
          if (events[eventName]) {
            events[eventName].forEach(callback => {
              try {
                callback(...args);
              } catch (error) {
                console.error(`Error in event handler for ${eventName}:`, error);
              }
            });
          }
        }
      };
    }
  }
};
