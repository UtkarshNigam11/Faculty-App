from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
from database import get_supabase


def send_push_notification(push_token: str, title: str, body: str, data: dict = None):
    """
    Send a push notification to a single device.
    
    Args:
        push_token: Expo push token (ExponentPushToken[xxxxx])
        title: Notification title
        body: Notification message
        data: Optional data payload
    """
    if not push_token or not push_token.startswith("ExponentPushToken"):
        print(f"[PUSH] Invalid push token: {push_token}")
        return None
    
    try:
        print(f"[PUSH] Sending to {push_token[:25]}... - Title: {title}")
        response = PushClient().publish(
            PushMessage(
                to=push_token,
                title=title,
                body=body,
                data=data or {},
                sound="default",
                badge=1,
                channel_id="substitute-requests",  # Android channel
            )
        )
        print(f"[PUSH] Response: {response}")
        return response
    except PushServerError as e:
        print(f"[PUSH] Push server error: {e}")
        return None
    except DeviceNotRegisteredError:
        # Token is invalid, could remove from database
        print(f"[PUSH] Device not registered (token expired): {push_token[:25]}...")
        return None
    except Exception as e:
        print(f"[PUSH] Push notification error: {e}")
        return None


def send_push_to_multiple(push_tokens: list, title: str, body: str, data: dict = None):
    """Send push notification to multiple devices."""
    messages = []
    for token in push_tokens:
        if token and token.startswith("ExponentPushToken"):
            messages.append(
                PushMessage(
                    to=token,
                    title=title,
                    body=body,
                    data=data or {},
                    sound="default",
                    badge=1,
                    channel_id="substitute-requests",
                )
            )
    
    if not messages:
        return []
    
    try:
        responses = PushClient().publish_multiple(messages)
        return responses
    except Exception as e:
        print(f"Push notification error: {e}")
        return []


async def notify_all_faculty_except(exclude_user_id: int, title: str, body: str, data: dict = None):
    """
    Send notification to all faculty EXCEPT the specified user.
    Used when a new request is created.
    """
    supabase = get_supabase()
    
    try:
        # Get all users with push tokens except the creator
        result = supabase.table("users")\
            .select("id, push_token")\
            .neq("id", exclude_user_id)\
            .not_.is_("push_token", "null")\
            .execute()
        
        print(f"[PUSH] notify_all_faculty_except: Found {len(result.data)} users with push tokens")
        
        tokens = [user["push_token"] for user in result.data if user.get("push_token")]
        
        if tokens:
            print(f"[PUSH] Sending notification to {len(tokens)} devices: {title}")
            send_push_to_multiple(tokens, title, body, data)
        else:
            print("[PUSH] No tokens found to send notifications to")
    except Exception as e:
        print(f"[PUSH] Error notifying faculty: {e}")


async def notify_user(user_id: int, title: str, body: str, data: dict = None):
    """
    Send notification to a specific user.
    Used when someone accepts/cancels a request.
    """
    supabase = get_supabase()
    
    try:
        print(f"[PUSH] notify_user: Looking up push token for user {user_id}")
        result = supabase.table("users")\
            .select("push_token")\
            .eq("id", user_id)\
            .execute()
        
        if result.data and result.data[0].get("push_token"):
            token = result.data[0]["push_token"]
            print(f"[PUSH] Found token for user {user_id}: {token[:20]}...")
            print(f"[PUSH] Sending notification: {title}")
            response = send_push_notification(token, title, body, data)
            print(f"[PUSH] Notification sent, response: {response}")
        else:
            print(f"[PUSH] No push token found for user {user_id}")
    except Exception as e:
        print(f"[PUSH] Error notifying user {user_id}: {e}")
