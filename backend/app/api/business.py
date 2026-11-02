from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_business_owner
from app.database.mongo import db_manager
from app.schemas.business import BusinessProfileResponse, BusinessUpdateRequest

router = APIRouter(prefix="/business", tags=["Business"])

@router.get("/profile", response_model=BusinessProfileResponse)
def get_business_profile(current_user: dict = Depends(get_current_business_owner)):
    biz_col = db_manager.get_collection("businesses")
    biz = biz_col.find_one({"_id": str(current_user["business_id"])})
    if not biz:
        raise HTTPException(status_code=404, detail="Business profile not found.")

    return BusinessProfileResponse(
        id=biz["_id"],
        owner_id=biz["owner_id"],
        business_name=biz["business_name"],
        business_slug=biz["business_slug"],
        logo=biz.get("logo"),
        description=biz.get("description"),
        created_at=biz.get("created_at", "")
    )

@router.put("/profile", response_model=BusinessProfileResponse)
def update_business_profile(
    req: BusinessUpdateRequest,
    current_user: dict = Depends(get_current_business_owner)
):
    biz_col = db_manager.get_collection("businesses")
    update_data = {}
    if req.business_name is not None:
        update_data["business_name"] = req.business_name
    if req.logo is not None:
        update_data["logo"] = req.logo
    if req.description is not None:
        update_data["description"] = req.description

    if update_data:
        biz_col.update_one(
            {"_id": str(current_user["business_id"])},
            {"$set": update_data}
        )

    biz = biz_col.find_one({"_id": str(current_user["business_id"])})
    return BusinessProfileResponse(
        id=biz["_id"],
        owner_id=biz["owner_id"],
        business_name=biz["business_name"],
        business_slug=biz["business_slug"],
        logo=biz.get("logo"),
        description=biz.get("description"),
        created_at=biz.get("created_at", "")
    )
