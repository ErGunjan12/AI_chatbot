from fastapi import APIRouter, Depends, Response
from app.api.deps import get_current_business_owner
from app.services.export_service import export_service

router = APIRouter(prefix="/export", tags=["Data Export"])

@router.get("/conversations")
def export_conversations(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    csv_content = export_service.export_conversations_csv(business_id)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=conversations_{business_id[:8]}.csv"}
    )

@router.get("/analytics")
def export_analytics(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    csv_content = export_service.export_analytics_csv(business_id)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=analytics_{business_id[:8]}.csv"}
    )

@router.get("/unanswered")
def export_unanswered(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    csv_content = export_service.export_unanswered_csv(business_id)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=unanswered_{business_id[:8]}.csv"}
    )
