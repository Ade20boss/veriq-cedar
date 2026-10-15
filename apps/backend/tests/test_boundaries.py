import ast
import importlib.util
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

from veriq_cedar.cedar.base import CedarBase
from veriq_cedar.cedar.simulator.base import SimulatorBase
from veriq_cedar.platform.database.revision import SCHEMA_REVISION
from veriq_cedar.veriq.persistence.base import VeriqBase

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"


def imports(path, source=SRC):
    package = ".".join(path.relative_to(source).with_suffix("").parts[:-1])
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.Import):
            yield from (alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            if node.level:
                module = importlib.util.resolve_name(
                    "." * node.level + (node.module or ""), package
                )
            else:
                module = node.module or ""
            yield module
            yield from (module + "." + alias.name for alias in node.names)


def test_veriq_cannot_import_cedar_persistence_or_simulator():
    for path in (SRC / "veriq_cedar/veriq").rglob("*.py"):
        assert not any(
            x.startswith(
                (
                    "veriq_cedar.cedar",
                    "veriq_cedar.platform.database.session",
                    "veriq_cedar.platform.settings",
                    "veriq_cedar.composition",
                )
            )
            for x in imports(path)
        ), path


def test_neutral_contracts_have_no_http_persistence_or_domain_dependencies():
    forbidden = (
        "sqlalchemy",
        "fastapi",
        "veriq_cedar.cedar",
        "veriq_cedar.veriq",
        "veriq_cedar.platform",
    )
    for path in (SRC / "veriq_cedar/integration").rglob("*.py"):
        assert not any(x.startswith(forbidden) for x in imports(path)), path


def test_metadata_registries_are_separate_and_only_authorized_g0_g1_g2_tables_exist():
    assert [base.metadata.schema for base in (CedarBase, VeriqBase, SimulatorBase)] == [
        "cedar",
        "veriq",
        "cedar_private",
    ]
    assert len({id(base.registry) for base in (CedarBase, VeriqBase, SimulatorBase)}) == 3
    from veriq_cedar.cedar.accounts import models as accounts  # noqa: F401
    from veriq_cedar.cedar.adapters import models  # noqa: F401
    from veriq_cedar.cedar.complaints import models as complaints  # noqa: F401
    from veriq_cedar.cedar.ledger import models as ledger  # noqa: F401
    from veriq_cedar.cedar.simulator import models as simulator  # noqa: F401
    from veriq_cedar.cedar.transfers import models as transfers  # noqa: F401
    from veriq_cedar.veriq.knowledge import models as knowledge  # noqa: F401
    from veriq_cedar.veriq.persistence import (
        operational,  # noqa: F401
        pitch,  # noqa: F401
    )

    assert len(CedarBase.metadata.tables) == 17
    assert len(VeriqBase.metadata.tables) == 13
    assert len(SimulatorBase.metadata.tables) == 2


def test_readiness_revision_matches_alembic_head():
    config = Config(str(ROOT / "alembic.ini"))
    assert ScriptDirectory.from_config(config).get_heads() == [SCHEMA_REVISION]


def test_import_guard_resolves_relative_cedar_import(tmp_path):
    # Exercise the guard against a forbidden relative import, not just current empty packages.
    probe = tmp_path / "veriq_cedar/veriq/_boundary_probe.py"
    probe.parent.mkdir(parents=True)
    try:
        probe.write_text("from ..cedar import base\n")
        assert "veriq_cedar.cedar" in set(imports(probe, tmp_path))
    finally:
        probe.unlink(missing_ok=True)
