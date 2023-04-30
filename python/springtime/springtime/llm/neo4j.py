from neo4j import GraphDatabase
from py2neo import Graph
import csv
from pydantic import BaseModel


class Row(BaseModel):
    first_name: str
    last_name: str
    company: str
    position: str


def get_data():

    with open('Connections.csv', 'r') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)
        next(reader)

        data = []

        for row in reader:
            if not row:
                continue

            first_name = row[0].strip()
            last_name = row[1].strip()
            company = row[3].strip()
            position = row[4].strip()

            parsed = Row(first_name=first_name, last_name=last_name,
                         company=company, position=position)
            data.append(parsed)

    return data


def play_neo4j():

    driver = GraphDatabase.driver(
        "bolt://localhost:7687", auth=("neo4j", "password"))

    data = get_data()

    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
        try:
            session.run(
                "CREATE CONSTRAINT FOR (p:Person) REQUIRE p.id IS UNIQUE")
            session.run(
                "CREATE CONSTRAINT FOR (p:Company) REQUIRE p.id IS UNIQUE")
        except Exception as e:
            print(e)

        for person in data:
            print(
                f"Inserting {person.first_name} {person.last_name} ({person.company})")
            session.run(
                "MERGE(:Person {name: $person_name, position: $position})", person_name=f"{person.first_name} {person.last_name}", position=person.position)

            session.run(
                "MERGE(:Company{id: $name, name: $name})", name=person.company)

            session.run("MATCH (a:Company{name: $name1}), (b:Person {name: $name2}) "
                        "CREATE (b)-[:WORKS_AT]->(a)",
                        name1=person.company,
                        name2=f"{person.first_name} {person.last_name}"
                        )
