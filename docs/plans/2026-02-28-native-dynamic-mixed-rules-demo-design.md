# Design: Native / Dynamic / Mixed Rules Demonstration

## Goal

Demonstrate that Rules4J supports fully native, fully dynamic, and mixed rules — all coexisting in the same flow. Use the payment-screening flow's real rules to show each mode naturally.

## Changes

### Step 1 — "Define your rules"

Replace the current snippet (all three rules using `dynamicCondition`/`dynamicAction`) with a snippet showing three rules, each using a different mode. The API method names (`fixedCondition` vs `dynamicCondition`) are self-documenting — no annotations needed.

**New snippet (Java):**

```java
var velocity = RuleDefinition.create("velocity")
        .fixedCondition("com.acme.rules.VelocityCondition")
        .fixedAction("com.acme.rules.VelocityAction")
        .build();

var geo = RuleDefinition.create("geo")
        .fixedCondition("com.acme.rules.GeoAnomalyCondition")
        .dynamicAction()
        .build();

var merchant = RuleDefinition.create("merchant")
        .dynamicCondition()
        .dynamicAction()
        .build();

// score, decision: also fully dynamic
```

**Mode distribution rationale (real-world payment screening):**

- **velocity → fully native**: Stable, performance-critical pattern. Transaction velocity checking rarely changes.
- **geo → mixed** (native condition + dynamic action): Geo anomaly detection is stable infrastructure, but response actions change with sanctions lists and regulations.
- **merchant → fully dynamic**: MCC risk lists and response procedures change frequently. Compliance team updates without deployments.
- **score, decision → fully dynamic** (shown in comment): Scoring weights and decision thresholds are business-sensitive and frequently tuned.

### Step 3 — "Compose Rules" (renamed from "Compose Dynamic Rules")

Add a tab switcher inside the code card to show both dynamic (Kotlin) and native (Java) rule implementations. Feature list headline changes from "Compose Dynamic Rules" to "Compose Rules". Supporting text stays: "Either use your application's classes or define dynamic rules via Kotlin."

**Tab 1: "Dynamic" — Kotlin (merchant rule)**

```kotlin
class MerchantCondition : RuleCondition {
  override fun evaluate(context: RuleContext): Boolean {
    val mcc: String by context
    return mcc in setOf("7995", "6051", "4829")
  }
}

class MerchantAction : RuleAction {
  override fun execute(context: RuleContext) {
    context.put("merchant_risk", "HIGH")
  }
}
```

**Tab 2: "Native" — Java (velocity rule)**

```java
public class VelocityCondition implements RuleCondition {
  @Override
  public boolean evaluate(RuleContext context) {
    int txCount = context.getFact("tx_count_1h");
    return txCount > 10;
  }
}

public class VelocityAction implements RuleAction {
  @Override
  public void execute(RuleContext context) {
    context.putFact("velocity_risk", "HIGH");
  }
}
```

Both tabs show the same interfaces (`RuleCondition` / `RuleAction`), reinforcing that the contract is identical regardless of mode.

## What doesn't change

- Steps 2 (flow definition), 4 (configure engine), 5 (execute), 6 (update at runtime)
- Feature list item text for steps 1, 2, 4, 5, 6
- Flow demo section
- Pipeline section
- All styling/layout
