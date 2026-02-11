![Rules4J Project Header Logo](https://raw.githubusercontent.com/rules4j/rules4j/main/docs/images/Rules4J.png)

# Rules4J
 
 Rule Engine for the JVM.

* Write rules in Kotlin
* Cloud native design
* Library compiles and loads rules as `.class` files accross all instances
* Your rules run at native speed

## First release is coming soon!

Check back on [Github](https://github.com/rules4j/rules4j) in a few days

## Example Rule

```kotlin
class YourCondition : RuleCondition {

    override fun evaluate(context: RuleContext): Boolean {

        val amount: Double by context
        val threshold: Double by context

        return amount > threshold
    }
}

class YourAction : RuleAction {

    override fun execute(context: RuleContext) {

        val customerId: String by context
        val amount: Double by context
        val notificationService: NotificationService by context
        val reviewService: ReviewService by context

        notificationService.notifyForProbableDelay(customerId)
        reviewService.submitForManualReview(customerId, amount)

        context.put("status", "MANUAL_REVIEW_REQUIRED")
    }
}
```

## License

The Rules4J library is released under version 2.0 of the [Apache License](https://www.apache.org/licenses/LICENSE-2.0).
