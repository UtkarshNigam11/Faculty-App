from fastapi import APIRouter, HTTPException, status
from typing import List

from database import get_supabase
from models import UserResponse, UserUpdate, PushTokenUpdate

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def get_all_users():
    """
    Get all registered faculty users.
    Returns users ordered by name.
    """
    supabase = get_supabase()
    
    try:
        result = supabase.table("users")\
            .select("id, name, email, department, phone, created_at")\
            .order("name")\
            .execute()
        
        users = []
        for user in result.data:
            users.append(UserResponse(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                department=user.get("department"),
                phone=user.get("phone"),
                created_at=user.get("created_at")
            ))
        
        return users
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """
    Get a specific user by ID.
    """
    supabase = get_supabase()
    
    try:
        result = supabase.table("users")\
            .select("id, name, email, department, phone, created_at")\
            .eq("id", user_id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user = result.data[0]
        return UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            department=user.get("department"),
            phone=user.get("phone"),
            created_at=user.get("created_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {str(e)}"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate):
    """
    Update user profile information.
    Only name, department, and phone can be updated.
    """
    supabase = get_supabase()
    
    try:
        # Check if user exists
        check_result = supabase.table("users")\
            .select("id")\
            .eq("id", user_id)\
            .execute()
        
        if not check_result.data or len(check_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Build update data (only non-None fields)
        update_data = {}
        if user_update.name is not None:
            update_data["name"] = user_update.name
        if user_update.department is not None:
            update_data["department"] = user_update.department
        if user_update.phone is not None:
            update_data["phone"] = user_update.phone
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update user
        result = supabase.table("users")\
            .update(update_data)\
            .eq("id", user_id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )
        
        user = result.data[0]
        return UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            department=user.get("department"),
            phone=user.get("phone"),
            created_at=user.get("created_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )


@router.put("/{user_id}/push-token")
async def update_push_token(user_id: int, token_update: PushTokenUpdate):
    """
    Update the push notification token for a user.
    Called from mobile app when registering for push notifications.
    """
    supabase = get_supabase()
    
    try:
        # Check if user exists
        check_result = supabase.table("users")\
            .select("id")\
            .eq("id", user_id)\
            .execute()
        
        if not check_result.data or len(check_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update push token
        result = supabase.table("users")\
            .update({"push_token": token_update.push_token})\
            .eq("id", user_id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update push token"
            )
        
        return {"message": "Push token updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update push token: {str(e)}"
        )


@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """
    Delete a user account.
    Warning: This will also delete all associated substitute requests.
    """
    supabase = get_supabase()
    
    try:
        # Check if user exists
        check_result = supabase.table("users")\
            .select("id")\
            .eq("id", user_id)\
            .execute()
        
        if not check_result.data or len(check_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete user (cascade will handle related requests)
        supabase.table("users").delete().eq("id", user_id).execute()
        
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )
