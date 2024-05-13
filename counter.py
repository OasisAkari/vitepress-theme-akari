from typing import Optional
import uvicorn
from fastapi import FastAPI
from sqlalchemy import Column, String, Integer, create_engine

from sqlalchemy.orm import declarative_base, sessionmaker

DB_LINK = "mysql+pymysql://user:password@address:port/database"


Base = declarative_base()

class Counter(Base):
    __tablename__ = "view_counter"
    path = Column(String(512), primary_key=True)
    counts = Column(Integer, default='0')


class DBSession:
    def __init__(self):
        self.engine = create_engine(DB_LINK, isolation_level="READ UNCOMMITTED")
        self.Session = sessionmaker()
        self.Session.configure(bind=self.engine)

    @property
    def session(self):
        return self.Session()

    def create(self):
        Base.metadata.create_all(bind=self.engine, checkfirst=True)



Session = DBSession()

Session.create()

dbsession = Session.session


def auto_rollback_error(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            dbsession.rollback()
            raise e

    return wrapper

class CounterUtils:
    def __init__(self, path):
        self.path = path
        self.counter = dbsession.query(Counter).filter_by(path=path).first()
        if not self.counter:
            self.counter = Counter(path=path)
            dbsession.add(self.counter)
            dbsession.commit()

    @auto_rollback_error
    def update(self):
        self.counter.counts += 1
        dbsession.commit()

    def get_counts(self):
        self.update()
        return self.counter.counts


app = FastAPI()


@app.get("/counter")
async def get_counts(path: Optional[str]):
    return {"counts": CounterUtils(path).get_counts()}


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8799)