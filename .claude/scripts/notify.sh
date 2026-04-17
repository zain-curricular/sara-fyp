#!/bin/bash

# Read the hook data from stdin
INPUT=$(cat)

# Extract notification details
HOOK_EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // "Unknown"')
NOTIFICATION_TYPE=$(echo "$INPUT" | jq -r '.notification_type // ""')
MESSAGE=$(echo "$INPUT" | jq -r '.message // ""')
SOURCE=$(echo "$INPUT" | jq -r '.source // ""')
REASON=$(echo "$INPUT" | jq -r '.reason // ""')

# ElevenLabs configuration
VOICE_ID="aEO01A4wXwd1O8GPgGlF"
MODEL_ID="eleven_multilingual_v2"

# Temp file for audio
AUDIO_FILE="/tmp/claude_notification.mp3"

# Determine the spoken message based on event type
case "$HOOK_EVENT" in
    "Notification")
        case "$NOTIFICATION_TYPE" in
            "permission_prompt")
                SPOKEN_MESSAGE="Boss, Claude requires your permission to proceed."
                TITLE="Permission Required"
                SOUND="Basso"
                ;;
            "idle_prompt")
                SPOKEN_MESSAGE="You there boss? Claude is waiting for your input."
                TITLE="Awaiting Input"
                SOUND="Ping"
                ;;
            "auth_success")
                SPOKEN_MESSAGE="Authentication successful boss. Claude is ready to continue."
                TITLE="Auth Success"
                SOUND="Glass"
                ;;
            "elicitation_dialog")
                SPOKEN_MESSAGE="Boss, Claude needs additional information for a connected tool."
                TITLE="Tool Input Required"
                SOUND="Submarine"
                ;;
            *)
                SPOKEN_MESSAGE="Boss, Claude has a notification for you."
                TITLE="Claude Notification"
                SOUND="Pop"
                ;;
        esac
        ;;
    "Stop")
        SPOKEN_MESSAGE="Boss, Claude has finished the task and is awaiting further instructions."
        TITLE="Task Complete"
        SOUND="Glass"
        ;;
    "SessionStart")
        case "$SOURCE" in
            "startup")
                SPOKEN_MESSAGE="Good day boss. Claude is now online and ready to assist."
                TITLE="Session Started"
                SOUND="Funk"
                ;;
            "resume")
                SPOKEN_MESSAGE="Welcome back boss. Resuming your previous session."
                TITLE="Session Resumed"
                SOUND="Funk"
                ;;
            "compact")
                SPOKEN_MESSAGE="Context compacted boss. Ready to continue."
                TITLE="Context Compacted"
                SOUND="Purr"
                ;;
            *)
                SPOKEN_MESSAGE="Claude session is starting boss."
                TITLE="Session Starting"
                SOUND="Funk"
                ;;
        esac
        ;;
    "SessionEnd")
        case "$REASON" in
            "clear")
                SPOKEN_MESSAGE="Session cleared boss. Until next time."
                TITLE="Session Ended"
                SOUND="Sosumi"
                ;;
            "logout")
                SPOKEN_MESSAGE="Logging out boss. Goodbye for now."
                TITLE="Logged Out"
                SOUND="Sosumi"
                ;;
            "prompt_input_exit")
                SPOKEN_MESSAGE="Session ended boss. See you soon."
                TITLE="Session Ended"
                SOUND="Sosumi"
                ;;
            *)
                SPOKEN_MESSAGE="Claude session has ended boss."
                TITLE="Session Ended"
                SOUND="Sosumi"
                ;;
        esac
        ;;
    *)
        SPOKEN_MESSAGE="Boss, Claude has something for your attention."
        TITLE="Claude Code"
        SOUND="Pop"
        ;;
esac

# Show macOS notification (immediate feedback)
terminal-notifier -title "$TITLE" -message "${MESSAGE:-$SPOKEN_MESSAGE}" -sound "$SOUND"

# Generate and play ElevenLabs audio
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$SPOKEN_MESSAGE\",
    \"model_id\": \"$MODEL_ID\",
    \"voice_settings\": {
      \"stability\": 0.5,
      \"similarity_boost\": 0.75
    }
  }" \
  --output "$AUDIO_FILE"

# Play the audio
afplay "$AUDIO_FILE"

# Clean up
rm -f "$AUDIO_FILE"