from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
)
from database import get_supabase
import os

# Initialize PushClient once
push_client = PushClient()


def send_push_notification(push_token: str, title: str, body: str, data: dict = None):
    """
    Send a push notification to a single device.
    """
    if not push_token:
        print(f"[PUSH] No push token provided")
        return None
    
    # Validate token format
    if not push_token.startswith("ExponentPushToken"):
        print(f"[PUSH] Invalid token format: {push_token[:30]}...")
        return None
    
    try:
        print(f"[PUSH] Sending notification: {title}")
        response = push_client.publish(
            PushMessage(
                to=push_token,
                title=title,
                body=body,
                data=data or {},
                sound="default",
                badge=1,
                channel_id="substitute-requests",
            )
        )
        print(f"[PUSH] Sent successfully to {push_token[:30]}...")
        return response
    except DeviceNotRegisteredError:
        print(f"[PUSH] Device not registered - token may be expired")
        # Could optionally remove invalid token from database here
        return None
    except PushServerError as e:
        print(f"[PUSH] Server error: {e}")
        return None
    except Exception as e:
        print(f"[PUSH] Error: {e}")
        return None


def send_push_to_multiple(push_tokens: list, title: str, body: str, data: dict = None):
    """Send push notification to multiple devices."""
    if not push_tokens:
        return []
    
    # Filter valid tokens
    valid_tokens = [t for t in push_tokens if t and t.startswith("ExponentPushToken")]
    
    if not valid_tokens:
        print(f"[PUSH] No valid tokens in list of {len(push_tokens)}")
        return []
    
    messages = [
        PushMessage(
            to=token,
            title=title,
            body=body,
            data=data or {},
            sound="default",
            badge=1,
            channel_id="substitute-requests",
        )
        for token in valid_tokens
    ]
    
    try:
        print(f"[PUSH] Sending to {len(messages)} devices: {title}")
        responses = push_client.publish_multiple(messages)
        print(f"[PUSH] Sent {len(responses)} notifications")
        return responses
    except Exception as e:
        print(f"[PUSH] Batch send error: {e}")
        return []


async def notify_all_faculty_except(exclude_user_id: int, title: str, body: str, data: dict = None):
    """
    Send notification to all faculty EXCEPT the specified user.
    Used when a new request is created.
    """
    supabase = get_supabase()
    
    try:
        # Get all users except the creator who have push tokens
        result = supabase.table("users")\
            .select("id, name, push_token")\
            .neq("id", exclude_user_id)\
            .execute()
        
        # Filter users with valid push tokens
        tokens = []
        for user in result.data:
            token = user.get("push_token")
            if token and token.startswith("ExponentPushToken"):
                tokens.append(token)
                print(f"[PUSH] Will notify: {user['name']} (ID: {user['id']})")
        
        if tokens:
            print(f"[PUSH] Notifying {len(tokens)} faculty members")
            send_push_to_multiple(tokens, title, body, data)
        else:
            print(f"[PUSH] No faculty with push tokens to notify (checked {len(result.data)} users)")
            
    except Exception as e:
        print(f"[PUSH] Error in notify_all_faculty_except: {e}")


async def notify_user(user_id: int, title: str, body: str, data: dict = None):
    """
    Send notification to a specific user.
    Used when someone accepts/cancels a request.
    """
    supabase = get_supabase()
    
    try:
        result = supabase.table("users")\
            .select("name, push_token")\
            .eq("id", user_id)\
            .execute()
        
        if not result.data:
            print(f"[PUSH] User {user_id} not found")
            return
        
        user = result.data[0]
        token = user.get("push_token")
        
        if token and token.startswith("ExponentPushToken"):
            print(f"[PUSH] Notifying user: {user['name']} (ID: {user_id})")
            send_push_notification(token, title, body, data)
        else:
            print(f"[PUSH] User {user['name']} has no push token registered")
            
    except Exception as e:
        print(f"[PUSH] Error in notify_user: {e}")
