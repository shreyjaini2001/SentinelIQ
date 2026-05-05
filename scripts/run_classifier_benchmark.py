"""
Phase 0 Exit Gate — Intent Classifier Benchmark
Runs the 200-item test set against the live classify endpoint and reports:
  - Overall accuracy
  - Per-class accuracy
  - Confusion matrix
  - All failed cases

Usage:
  python scripts/run_classifier_benchmark.py
  python scripts/run_classifier_benchmark.py --url http://localhost:8000 --out results.json
"""
import argparse
import asyncio
import json
import sys
from collections import defaultdict
from pathlib import Path

try:
    import httpx
except ImportError:
    print("httpx required: pip install httpx")
    sys.exit(1)

TESTSET_PATH = Path(__file__).parent.parent / "data" / "test_sets" / "intent_classifier_200.jsonl"
MODES = ["query", "action", "refine"]


async def run(base_url: str, timeout: float) -> dict:
    cases = [json.loads(line) for line in TESTSET_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]
    total = len(cases)

    correct = 0
    confusion: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    failed: list[dict] = []
    errors: list[dict] = []

    async with httpx.AsyncClient(base_url=base_url, timeout=timeout) as client:
        for i, case in enumerate(cases, 1):
            text = case["text"]
            expected = case["mode"]
            try:
                resp = await client.post("/api/v1/classify", json={"text": text})
                resp.raise_for_status()
                data = resp.json()
                predicted = data.get("mode", "")
                confidence = data.get("confidence", 0.0)

                confusion[expected][predicted] += 1

                if predicted == expected:
                    correct += 1
                else:
                    failed.append({
                        "index": i,
                        "text": text,
                        "expected": expected,
                        "predicted": predicted,
                        "confidence": round(confidence, 3),
                        "intent_label": data.get("intent_label", ""),
                    })
            except Exception as exc:
                errors.append({"index": i, "text": text, "error": str(exc)})

    accuracy = correct / total if total else 0.0

    per_class: dict[str, dict] = {}
    for mode in MODES:
        mode_total = sum(confusion[mode].values())
        mode_correct = confusion[mode].get(mode, 0)
        per_class[mode] = {
            "total": mode_total,
            "correct": mode_correct,
            "accuracy": round(mode_correct / mode_total, 4) if mode_total else 0.0,
        }

    return {
        "total": total,
        "correct": correct,
        "accuracy": round(accuracy, 4),
        "per_class": per_class,
        "confusion_matrix": {k: dict(v) for k, v in confusion.items()},
        "failed_cases": failed,
        "errors": errors,
    }


def print_report(results: dict) -> None:
    acc = results["accuracy"]
    total = results["total"]
    correct = results["correct"]
    status = "PASS" if acc >= 0.85 else "FAIL"

    print(f"\n{'='*60}")
    print(f"  SentinelIQ Classifier Benchmark — Phase 0 Exit Gate")
    print(f"{'='*60}")
    print(f"  Overall accuracy : {acc:.1%}  ({correct}/{total})   [{status}]")
    print(f"  Threshold        : 85.0%")
    print()

    print("  Per-class accuracy:")
    for mode, stats in results["per_class"].items():
        bar = "#" * int(stats["accuracy"] * 20)
        print(f"    {mode:<8} {stats['accuracy']:.1%}  [{bar:<20}]  ({stats['correct']}/{stats['total']})")

    print()
    print("  Confusion matrix (rows=expected, cols=predicted):")
    modes = list(results["per_class"].keys())
    header = "           " + "  ".join(f"{m[:6]:>6}" for m in modes)
    print(f"  {header}")
    for expected in modes:
        row = "  ".join(
            f"{results['confusion_matrix'].get(expected, {}).get(pred, 0):>6}"
            for pred in modes
        )
        print(f"    {expected:<8} {row}")

    if results["failed_cases"]:
        print(f"\n  Failed cases ({len(results['failed_cases'])}):")
        for fc in results["failed_cases"][:20]:
            print(f"    [{fc['index']:>3}] expected={fc['expected']:<7} got={fc['predicted']:<7} conf={fc['confidence']:.2f}")
            print(f"         \"{fc['text'][:70]}\"")
        if len(results["failed_cases"]) > 20:
            print(f"    ... and {len(results['failed_cases']) - 20} more (see --out for full list)")

    if results["errors"]:
        print(f"\n  Errors ({len(results['errors'])}):")
        for e in results["errors"][:5]:
            print(f"    [{e['index']}] {e['error']}")

    print(f"\n  Result: {status}")
    print(f"{'='*60}\n")


async def main() -> None:
    parser = argparse.ArgumentParser(description="SentinelIQ classifier benchmark")
    parser.add_argument("--url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--timeout", type=float, default=10.0, help="Per-request timeout (seconds)")
    parser.add_argument("--out", help="Write full results JSON to this file")
    args = parser.parse_args()

    if not TESTSET_PATH.exists():
        print(f"Test set not found: {TESTSET_PATH}")
        sys.exit(1)

    print(f"Running benchmark against {args.url} ...")
    results = await run(args.url, args.timeout)
    print_report(results)

    if args.out:
        Path(args.out).write_text(json.dumps(results, indent=2), encoding="utf-8")
        print(f"Full results written to {args.out}")

    sys.exit(0 if results["accuracy"] >= 0.85 else 1)


if __name__ == "__main__":
    asyncio.run(main())
