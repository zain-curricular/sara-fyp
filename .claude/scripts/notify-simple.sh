#!/bin/bash

# ============================================================================
# Simple Notification Script (No ElevenLabs)
# ============================================================================
#
# Lightweight notification script using only macOS system sounds.
# Use this when ElevenLabs subscription is inactive.
#
# To switch between scripts, update your Claude Code settings:
#   - ElevenLabs: .claude/scripts/notify.sh
#   - Simple:     .claude/scripts/notify-simple.sh
#

# Read the hook data from stdin
INPUT=$(cat)

# Extract notification details
HOOK_EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // "Unknown"')
NOTIFICATION_TYPE=$(echo "$INPUT" | jq -r '.notification_type // ""')
MESSAGE=$(echo "$INPUT" | jq -r '.message // ""')
SOURCE=$(echo "$INPUT" | jq -r '.source // ""')
REASON=$(echo "$INPUT" | jq -r '.reason // ""')

# Determine notification details based on event type
case "$HOOK_EVENT" in
    "Notification")
        case "$NOTIFICATION_TYPE" in
            "permission_prompt")
                TITLE="Permission Required"
                SOUND="Basso"
                DEFAULT_MSG="Claude requires your permission to proceed."
                ;;
            "idle_prompt")
                TITLE="Awaiting Input"
                SOUND="Ping"
                DEFAULT_MSG="Claude is waiting for your input."
                ;;
            "auth_success")
                TITLE="Auth Success"
                SOUND="Glass"
                DEFAULT_MSG="Authentication successful."
                ;;
            "elicitation_dialog")
                TITLE="Tool Input Required"
                SOUND="Submarine"
                DEFAULT_MSG="Claude needs additional information."
                ;;
            *)
                TITLE="Claude Notification"
                SOUND="Pop"
                DEFAULT_MSG="Claude has a notification for you."
                ;;
        esac
        ;;
    "Stop")
        TITLE="Task Complete"
        SOUND="Glass"
        DEFAULT_MSG="Claude has finished the task."
        ;;
    "SessionStart")
        case "$SOURCE" in
            "startup")
                TITLE="Session Started"
                SOUND="Funk"
                DEFAULT_MSG="Claude is now online and ready."
                ;;
            "resume")
                TITLE="Session Resumed"
                SOUND="Funk"
                DEFAULT_MSG="Resuming your previous session."
                ;;
            "compact")
                TITLE="Context Compacted"
                SOUND="Purr"
                DEFAULT_MSG="Context compacted. Ready to continue."
                ;;
            *)
                TITLE="Session Starting"
                SOUND="Funk"
                DEFAULT_MSG="Claude session is starting."
                ;;
        esac
        ;;
    "SessionEnd")
        case "$REASON" in
            "clear")
                TITLE="Session Ended"
                SOUND="Sosumi"
                DEFAULT_MSG="Session cleared."
                ;;
            "logout")
                TITLE="Logged Out"
                SOUND="Sosumi"
                DEFAULT_MSG="Logging out."
                ;;
            "prompt_input_exit")
                TITLE="Session Ended"
                SOUND="Sosumi"
                DEFAULT_MSG="Session ended."
                ;;
            *)
                TITLE="Session Ended"
                SOUND="Sosumi"
                DEFAULT_MSG="Claude session has ended."
                ;;
        esac
        ;;
    *)
        TITLE="Claude Code"
        SOUND="Pop"
        DEFAULT_MSG="Claude has something for your attention."
        ;;
esac

# Show macOS notification with sound
terminal-notifier -title "$TITLE" -message "${MESSAGE:-$DEFAULT_MSG}" -sound "$SOUND"