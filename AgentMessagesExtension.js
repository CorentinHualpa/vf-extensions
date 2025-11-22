/**
 * Agent Messages Extension for Voiceflow
 * 
 * This extension polls for agent messages from the Human-in-the-Loop system
 * and injects them into the Voiceflow widget in real-time.
 * 
 * Usage:
 * 1. Include this script on your page
 * 2. Configure your Voiceflow widget with this extension
 * 3. Messages sent by agents will automatically appear in the widget
 */

(function() {
  'use strict';

  const DEFAULT_POLL_INTERVAL = 2000; // Default: poll every 2 seconds

  class AgentMessagesExtension {
    constructor() {
      this.pollingInterval = null;
      this.currentSessionId = null;
      this.chatbotId = null;
      this.apiBaseUrl = null;
      this.pollInterval = DEFAULT_POLL_INTERVAL;
      this.lastCheckedTime = Date.now();
    }

    // Called by Voiceflow when the extension is loaded
    name() {
      return 'AgentMessages';
    }

    // Initialize the extension
    async initialize({ config }) {
      // Get configuration
      this.chatbotId = config.chatbotId;
      this.apiBaseUrl = config.apiBaseUrl || window.location.origin; // Default to current origin
      this.pollInterval = config.pollInterval || DEFAULT_POLL_INTERVAL;
      
      if (!this.chatbotId) {
        console.error('[AgentMessagesExtension] chatbotId is required in config');
        return;
      }

      console.log('[AgentMessagesExtension] Initialized');
      console.log('[AgentMessagesExtension] - chatbotId:', this.chatbotId);
      console.log('[AgentMessagesExtension] - apiBaseUrl:', this.apiBaseUrl);
      console.log('[AgentMessagesExtension] - pollInterval:', this.pollInterval, 'ms');

      // Start polling when the widget loads
      this.startPolling();
    }

    // Get current session ID from Voiceflow runtime
    getSessionId() {
      try {
        // Extract session ID from Voiceflow's internal state
        if (window.voiceflow && window.voiceflow.chat) {
          const state = window.voiceflow.chat.proactive;
          // The session ID is usually stored in localStorage
          const sessionId = localStorage.getItem('vf_session_id');
          if (sessionId) {
            return sessionId;
          }
        }
        return null;
      } catch (error) {
        console.error('[AgentMessagesExtension] Error getting session ID:', error);
        return null;
      }
    }

    // Start polling for new messages
    startPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }

      this.pollingInterval = setInterval(() => {
        this.checkForNewMessages();
      }, this.pollInterval);

      // Check immediately on start
      this.checkForNewMessages();
    }

    // Stop polling
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    }

    // Check for new messages from the API
    async checkForNewMessages() {
      try {
        const sessionId = this.getSessionId();
        
        if (!sessionId) {
          return; // No active session yet
        }

        // Update current session if changed
        if (this.currentSessionId !== sessionId) {
          this.currentSessionId = sessionId;
          console.log('[AgentMessagesExtension] Session updated:', sessionId);
        }

        // Fetch unread messages
        const response = await fetch(
          `${this.apiBaseUrl}/api/sessions/${sessionId}/agent-messages?chatbotId=${this.chatbotId}`
        );

        if (!response.ok) {
          console.error('[AgentMessagesExtension] Failed to fetch messages:', response.status);
          return;
        }

        const data = await response.json();
        const messages = data.messages || [];

        if (messages.length > 0) {
          console.log(`[AgentMessagesExtension] Received ${messages.length} new message(s)`);
          
          // Inject messages into the widget
          for (const message of messages) {
            await this.injectMessage(message);
          }

          // Mark messages as delivered
          await this.markMessagesAsDelivered(messages.map(m => m.id));
        }
      } catch (error) {
        console.error('[AgentMessagesExtension] Error checking for messages:', error);
      }
    }

    // Inject a message into the Voiceflow widget
    async injectMessage(message) {
      try {
        if (!window.voiceflow || !window.voiceflow.chat) {
          console.error('[AgentMessagesExtension] Voiceflow chat not available');
          return;
        }

        // Use Voiceflow's proactive messages API to display the agent message
        window.voiceflow.chat.proactive.push({
          type: 'text',
          payload: {
            message: `Agent: ${message.message}`
          }
        });

        console.log('[AgentMessagesExtension] Injected message:', message.message);

        // Open the widget if it's closed so the user sees the message
        if (!window.voiceflow.chat.isOpen) {
          window.voiceflow.chat.open();
        }
      } catch (error) {
        console.error('[AgentMessagesExtension] Error injecting message:', error);
      }
    }

    // Mark messages as delivered
    async markMessagesAsDelivered(messageIds) {
      try {
        if (messageIds.length === 0) return;

        await fetch(
          `${this.apiBaseUrl}/api/sessions/${this.currentSessionId}/mark-read`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              messageIds,
              chatbotId: this.chatbotId
            }),
          }
        );

        console.log('[AgentMessagesExtension] Marked messages as delivered:', messageIds.length);
      } catch (error) {
        console.error('[AgentMessagesExtension] Error marking messages as delivered:', error);
      }
    }

    // Clean up when extension is destroyed
    destroy() {
      this.stopPolling();
    }
  }

  // Export the extension
  window.AgentMessagesExtension = AgentMessagesExtension;

  console.log('[AgentMessagesExtension] Extension loaded successfully');
})();
