"""One-off cleanup of QA-created test data (TESTQA lead + its email logs + TESTQA campaign logs)."""
import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    leads = await db.leads.find({"voornaam": {"$regex": "^TESTQA"}}, {"_id": 0, "id": 1}).to_list(100)
    ids = [l["id"] for l in leads]
    print("leads to delete:", ids)
    if ids:
        print("leads deleted:", (await db.leads.delete_many({"id": {"$in": ids}})).deleted_count)
        print("emails deleted:", (await db.emails.delete_many({"lead_id": {"$in": ids}})).deleted_count)
    print("campaign logs deleted:", (await db.emails.delete_many({"subject": {"$regex": "^TESTQA"}})).deleted_count)
    print("remaining leads:", await db.leads.count_documents({}))
    client.close()


asyncio.run(main())
