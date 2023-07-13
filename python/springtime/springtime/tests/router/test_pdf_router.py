from fastapi import FastAPI
from fastapi.testclient import TestClient

from springtime.excel.table_extractor import TabulaTableExtractor
from springtime.object_store.object_store import GCSObjectStore
from springtime.routers.pdf_router import PdfRouter

app = FastAPI()

OBJECT_STORE = GCSObjectStore()
TABLE_EXTRACTOR = TabulaTableExtractor(OBJECT_STORE)


@app.get("/")
async def read_main():
    return {"msg": "Hello World"}


app.include_router(PdfRouter(TABLE_EXTRACTOR, OBJECT_STORE).get_router())

client = TestClient(app)


def test_read_main(bucket_name: str):
    response = client.post(
        "/pdf/extract-tables",
        json={
            "bucket": bucket_name,
            "object_path": "user-uploads/d600c7a6-54bf-44a5-8bd1-484d9223e54a/173c517d-7037-4781-a59d-6de3561c7726/364025b42216f1ec184ce281db10830c.pdf",
            "output_prefix": "unit-test",
            "title": "American-CIM",
        },
    )
    value = response.json()
    assert value["number_of_sheets"] == 1
    assert value["object_path"]
