# Overview

Install `dbmate` plz

```sh
brew install dbmate
```

Run migration through Docker

```sh
docker compose up
```

## Style guide

- Table names are always singular
- Cardinality should be enforced at the application layer and database layer when possible.
- Add more checks rather than less (they can always be removed if needed)
