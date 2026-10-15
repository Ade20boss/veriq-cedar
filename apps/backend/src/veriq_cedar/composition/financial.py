"""Composition alone supplies the private network capability to the sender dispatcher."""

from veriq_cedar.cedar.simulator.network import SyntheticNetwork
from veriq_cedar.cedar.transfers.dispatcher import Dispatcher
from veriq_cedar.platform.database.session import DatabaseDependency, DatabaseDomain


def get_dispatcher(databases: DatabaseDependency) -> Dispatcher:
    return Dispatcher(
        databases.sessions[DatabaseDomain.CEDAR],
        SyntheticNetwork(databases.sessions[DatabaseDomain.SIMULATOR], "CED"),
    )
