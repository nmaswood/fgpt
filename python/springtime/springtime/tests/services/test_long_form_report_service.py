import pytest

from springtime.services.anthropic_client import AnthropicClient
from springtime.services.long_form_report_service import (
    ClaudeLongformReportService,
    LongformReportService,
)


@pytest.fixture()
def anthropic_client():
    return AnthropicClient()


@pytest.fixture()
def long_form_report_service(anthropic_client: AnthropicClient):
    return ClaudeLongformReportService(anthropic_client)


DATA = """

NASR MASWOOD
(860) - 834 - 6298 � nasrmaswood@gmail.com

github.com/nmaswood � linkedin.com/in/nasr-maswood

TECHNICAL STRENGTHS

Languages/Tools Python, Node, Typescript, React, Java, Elasticsearch, MySQL, PSQL, Google Cloud

WORK EXPERIENCE

Songbird Therapy December 2022 - Feb 2023
Engineering Lead New York City

Songbird Therapy is a tech enabled Autism care provider. I was hired as the first Software Engineer to lead our
technology initiatives, including automating internal processes for efficiency and rolling out external facing tools for
parents and care providers. Due to funding issues Songbird shutdown at the end of February.

· Built and a deployed a Next.js / Node / Typescript / Postgres application on Google Cloud to automate patient
intake.

· Implemented and managed analytics/engagement across the organization for our marketing website, application and
all public facing forms

Labelbox January 2020 - November 2022
Software Engineer II, Senior Software Engineer, Techlead New York City

Labelbox is a training data platform start up. I joined Labelbox with my two co-founders from Thirtynine.ai. Our
primary initiative at Labelbox was to build Catalog. Catalog is a massively scalable data asset viewer for users to
better understand their labeling assets.

· Implemented our data asset viewer product Catalog through several iterations of work. Built front-end components
via React, helped manage and design our Elasticsearch implementation and worked on our RabbitMQ/Debezium
data ingestion pipeline.

Thirtynine.ai July 2020 - December 2020
Co-founder New York City

Thirtynine.ai is a start up I co-founded which captures rail way network imagery data. Thirtynine.ai was acquired by
Labelbox in December 2020

· Built a data pipeline on top of Pubsub/Tensorflow/BigQuery to classify and store railway imagery data in real time
from video streams.

· Built a React/Node.js application to visualize predictions in real time.

Ironclad November 2018 - December 2020
Software Engineer, Software Engineer II San Francisco / New York City

Ironclad is a Contract Management start up. At Ironclad my primary project was working on Repository. Repository
is a tool that lets users store and gain insights from their contract data.

· Worked across front end and back-end for Repository including a spearheading a major Elasticsearch schema migra-
tion.

· Owned customer legacy contract import. This entailed writing bespoke scripts (and eventually automated tooling)
for pushing legacy contract data into Repository.

EDUCATION

University of Chicago June 2017
B.S. in Computer Science

tel:+18608346298
mailto:nasrmaswood@gmail.com
https://github.com/nmaswood
https://www.linkedin.com/in/nasr-maswood
https://www.songbirdcare.com/
https://labelbox.com/
https://labelbox.com/product/catalog
https://labelbox.com/blog/thirtynine-ai-has-joined-labelbox/
https://ironcladapp.com/
https://ironcladapp.com/product/data-repository/
"""


def test_report(long_form_report_service: LongformReportService):
    resp = long_form_report_service.generate(DATA)
    breakpoint()
    assert resp
