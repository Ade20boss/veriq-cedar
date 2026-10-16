"""Conservatively recover explicit source aliases lacking identifiers."""
from __future__ import annotations
import re
from .schemas import AIExtractInput, AIExtractOutput

_NAMED_ALIAS = re.compile(
    r"\b(?:refers?\s+to|calls?|describes?|labels?)\s+"
    r"(?:an?|the)\s+(?:[\w-]+\s+){0,6}?"
    r"(?:as|called|named)\s+(?P<alias>[A-Z][A-Za-z0-9_-]{1,63})\b"
    r"(?P<context>[^.!?\n]{0,150})", re.IGNORECASE,
)
_MISSING_IDENTIFIER = re.compile(
    r"\b(?:"
    r"(?:with\s+)?no\s+(?:(?:official|registered|canonical|service)\s+){0,2}(?:identifier|id)"
    r"|(?:the\s+)?(?:(?:official|registered|canonical|service)\s+){0,2}"
    r"(?:identifier|id)\s+(?:is\s+)?(?:not\s+(?:stated|provided|documented)|unknown|missing)"
    r")\b", re.IGNORECASE,
)

def recover_unresolved_aliases(request: AIExtractInput, result: AIExtractOutput) -> None:
    """Source-derived unresolved mentions only; never synthesize IDs or claims.

    Match bounded source sentences declaring an explicit alias with missing
    canonical identity. All output remains candidate knowledge for review.
    """
    existing = list(result.unresolved_mentions)
    added = False
    for chunk in request.chunks:
        for match in _NAMED_ALIAS.finditer(chunk.text):
            if not _MISSING_IDENTIFIER.search(match.group("context")):
                continue
            alias = match.group("alias")
            if any(alias.casefold() in mention.casefold() for mention in existing):
                continue
            existing.append(alias)
            added = True
    if added:
        result.unresolved_mentions = existing
        if "SOURCE_BACKED_ALIAS_RECOVERY" not in result.warnings:
            result.warnings.append("SOURCE_BACKED_ALIAS_RECOVERY")
