from fastapi import APIRouter, HTTPException, status
from typing import List

from database import get_supabase
from models import (
    SubstituteRequestCreate,
    SubstituteRequestResponse,
    SubstituteRequestUpdate,
    AcceptRequest,
    CancelRequest
)
from services.push_notifications import notify_all_faculty_except, notify_user

router = APIRouter()


@router.get("/", response_model=List[SubstituteRequestResponse])
async def get_pending_requests():
    """
    Get all pending substitute requests.
    Returns requests ordered by date and time.
    """
    supabase = get_supabase()
    
    try:
        # Get pending requests with teacher name
        result = supabase.table("substitute_requests")\
            .select("*, users!substitute_requests_teacher_id_fkey(name)")\
            .eq("status", "pending")\
            .order("date")\
            .order("time")\
            .execute()
        
        requests_list = []
        for req in result.data:
            teacher_name = None
            if req.get("users"):
                teacher_name = req["users"].get("name")
            
            requests_list.append(SubstituteRequestResponse(
                id=req["id"],
                teacher_id=req["teacher_id"],
                subject=req["subject"],
                date=req["date"],
                time=req["time"],
                duration=req["duration"],
                classroom=req["classroom"],
                notes=req.get("notes"),
                status=req["status"],
                accepted_by=req.get("accepted_by"),
                created_at=req.get("created_at"),
                updated_at=req.get("updated_at"),
                teacher_name=teacher_name
            ))
        
        return requests_list
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch requests: {str(e)}"
        )


@router.get("/teacher/{teacher_id}", response_model=List[SubstituteRequestResponse])
async def get_teacher_requests(teacher_id: int):
    """
    Get all substitute requests created by a specific teacher.
    """
    supabase = get_supabase()
    
    try:
        # Get requests with acceptor name
        result = supabase.table("substitute_requests")\
            .select("*, acceptor:users!substitute_requests_accepted_by_fkey(name)")\
            .eq("teacher_id", teacher_id)\
            .order("created_at", desc=True)\
            .execute()
        
        requests_list = []
        for req in result.data:
            acceptor_name = None
            if req.get("acceptor"):
                acceptor_name = req["acceptor"].get("name")
            
            requests_list.append(SubstituteRequestResponse(
                id=req["id"],
                teacher_id=req["teacher_id"],
                subject=req["subject"],
                date=req["date"],
                time=req["time"],
                duration=req["duration"],
                classroom=req["classroom"],
                notes=req.get("notes"),
                status=req["status"],
                accepted_by=req.get("accepted_by"),
                created_at=req.get("created_at"),
                updated_at=req.get("updated_at"),
                acceptor_name=acceptor_name
            ))
        
        return requests_list
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch teacher requests: {str(e)}"
        )


@router.get("/{request_id}", response_model=SubstituteRequestResponse)
async def get_request(request_id: int):
    """
    Get a specific substitute request by ID.
    """
    supabase = get_supabase()
    
    try:
        result = supabase.table("substitute_requests")\
            .select("*, teacher:users!substitute_requests_teacher_id_fkey(name), acceptor:users!substitute_requests_accepted_by_fkey(name)")\
            .eq("id", request_id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Request not found"
            )
        
        req = result.data[0]
        teacher_name = req["teacher"]["name"] if req.get("teacher") else None
        acceptor_name = req["acceptor"]["name"] if req.get("acceptor") else None
        
        return SubstituteRequestResponse(
            id=req["id"],
            teacher_id=req["teacher_id"],
            subject=req["subject"],
            date=req["date"],
            time=req["time"],
            duration=req["duration"],
            classroom=req["classroom"],
            notes=req.get("notes"),
            status=req["status"],
            accepted_by=req.get("accepted_by"),
            created_at=req.get("created_at"),
            updated_at=req.get("updated_at"),
            teacher_name=teacher_name,
            acceptor_name=acceptor_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch request: {str(e)}"
        )


@router.post("/", response_model=SubstituteRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(request: SubstituteRequestCreate):
    """
    Create a new substitute request.
    """
    supabase = get_supabase()
    
    try:
        # Verify teacher exists
        teacher_result = supabase.table("users").select("id, name").eq("id", request.teacher_id).execute()
        
        if not teacher_result.data or len(teacher_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
        
        teacher_name = teacher_result.data[0]["name"]
        
        # Create request
        new_request = {
            "teacher_id": request.teacher_id,
            "subject": request.subject,
            "date": str(request.date),
            "time": request.time,
            "duration": request.duration,
            "classroom": request.classroom,
            "notes": request.notes,
            "status": "pending"
        }
        
        result = supabase.table("substitute_requests").insert(new_request).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create request"
            )
        
        req = result.data[0]
        
        # Send push notification to all other faculty
        await notify_all_faculty_except(
            exclude_user_id=request.teacher_id,
            title="📚 New Substitute Request",
            body=f"{teacher_name} needs a substitute for {request.subject} on {request.date} at {request.time}",
            data={
                "type": "new_request",
                "request_id": req["id"],
                "subject": request.subject,
            }
        )
        
        return SubstituteRequestResponse(
            id=req["id"],
            teacher_id=req["teacher_id"],
            subject=req["subject"],
            date=req["date"],
            time=req["time"],
            duration=req["duration"],
            classroom=req["classroom"],
            notes=req.get("notes"),
            status=req["status"],
            accepted_by=req.get("accepted_by"),
            created_at=req.get("created_at"),
            updated_at=req.get("updated_at"),
            teacher_name=teacher_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create request: {str(e)}"
        )


@router.put("/{request_id}/accept", response_model=SubstituteRequestResponse)
async def accept_request(request_id: int, accept_data: AcceptRequest):
    """
    Accept a pending substitute request.
    """
    supabase = get_supabase()
    
    try:
        # Check if request exists and is pending
        check_result = supabase.table("substitute_requests")\
            .select("*")\
            .eq("id", request_id)\
            .execute()
        
        if not check_result.data or len(check_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Request not found"
            )
        
        if check_result.data[0]["status"] != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Request is not available for acceptance"
            )
        
        # Verify acceptor exists and get their name
        acceptor_result = supabase.table("users")\
            .select("id, name")\
            .eq("id", accept_data.teacher_id)\
            .execute()
        
        if not acceptor_result.data or len(acceptor_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Accepting teacher not found"
            )
        
        acceptor_name = acceptor_result.data[0]["name"]
        original_request = check_result.data[0]
        
        # Accept the request
        result = supabase.table("substitute_requests")\
            .update({
                "status": "accepted",
                "accepted_by": accept_data.teacher_id,
                "updated_at": "now()"
            })\
            .eq("id", request_id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to accept request"
            )
        
        req = result.data[0]
        
        # Notify the original requester that their request was accepted
        await notify_user(
            user_id=original_request["teacher_id"],
            title="✅ Request Accepted!",
            body=f"{acceptor_name} will cover your {req['subject']} class on {req['date']} at {req['time']}",
            data={
                "type": "request_accepted",
                "request_id": request_id,
            }
        )
        
        return SubstituteRequestResponse(
            id=req["id"],
            teacher_id=req["teacher_id"],
            subject=req["subject"],
            date=req["date"],
            time=req["time"],
            duration=req["duration"],
            classroom=req["classroom"],
            notes=req.get("notes"),
            status=req["status"],
            accepted_by=req.get("accepted_by"),
            created_at=req.get("created_at"),
            updated_at=req.get("updated_at"),
            acceptor_name=acceptor_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept request: {str(e)}"
        )


@router.put("/{request_id}/cancel", response_model=SubstituteRequestResponse)
async def cancel_request(request_id: int, cancel_data: CancelRequest):
    """
    Cancel a substitute request (only by the teacher who created it).
    """
    supabase = get_supabase()
    
    try:
        # Check if request exists and belongs to the teacher
        check_result = supabase.table("substitute_requests")\
            .select("*")\
            .eq("id", request_id)\
            .eq("teacher_id", cancel_data.teacher_id)\
            .execute()
        
        if not check_result.data or len(check_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Request not found or unauthorized"
            )
        
        original_request = check_result.data[0]
        
        # Cancel the request
        result = supabase.table("substitute_requests")\
            .update({
                "status": "cancelled",
                "updated_at": "now()"
            })\
            .eq("id", request_id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel request"
            )
        
        req = result.data[0]
        
        # If request was accepted by someone, notify them about cancellation
        if original_request.get("accepted_by"):
            await notify_user(
                user_id=original_request["accepted_by"],
                title="❌ Request Cancelled",
                body=f"The substitute request for {req['subject']} on {req['date']} has been cancelled",
                data={
                    "type": "request_cancelled",
                    "request_id": request_id,
                }
            )
        
        return SubstituteRequestResponse(
            id=req["id"],
            teacher_id=req["teacher_id"],
            subject=req["subject"],
            date=req["date"],
            time=req["time"],
            duration=req["duration"],
            classroom=req["classroom"],
            notes=req.get("notes"),
            status=req["status"],
            accepted_by=req.get("accepted_by"),
            created_at=req.get("created_at"),
            updated_at=req.get("updated_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel request: {str(e)}"
        )


@router.delete("/{request_id}")
async def delete_request(request_id: int, teacher_id: int):
    """
    Delete a substitute request (only by the teacher who created it).
    Pass teacher_id as query parameter: /api/requests/{request_id}?teacher_id=1
    """
    supabase = get_supabase()
    
    try:
        # Check if request exists and belongs to the teacher
        check_result = supabase.table("substitute_requests")\
            .select("*")\
            .eq("id", request_id)\
            .eq("teacher_id", teacher_id)\
            .execute()
        
        if not check_result.data or len(check_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Request not found or unauthorized"
            )
        
        # Delete the request
        supabase.table("substitute_requests").delete().eq("id", request_id).execute()
        
        return {"message": "Request deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete request: {str(e)}"
        )
