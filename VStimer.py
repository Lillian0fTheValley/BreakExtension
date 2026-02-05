import time
import random
import json


class BrkRmndr:
    def __init__ (self, wrkmins, brkmins) -> None:
        self.wrksecs = wrkmins * 60
        self.brksecs = brkmins * 60
        self.user_inputs = {
            "setup": {
                "Set work time: ": wrkmins,
                "Set break time: ": brkmins
            },
            "session responses": []
        }
        self.startTime = time.time()
        self.endTime = self.startTime + self.wrksecs
        self.wrkMsg = [
            "Hey! You've been working hard for a while.",
            "Nice focus! Might be time for a break.",
            "You've earned a short break!",
            "Time check — consider resting your brain."
        ]

        self.brkMsg = [
            "Break time! Step away from the keyboard.",
            "Go stretch, hydrate, or relax for a bit.",
            "Enjoy your break — you've earned it."
        ]

        self.retMsg = [
            "Welcome back! Ready to continue?",
            "Hope you're feeling refreshed!",
            "Let's get back to coding!"
        ]


    def getRandom(self, msg: list[str]) -> str:
        return random.choice(msg)



    def activate(self):
        try:
            while True:
                time.sleep(self.wrksecs)

                print("\n" + self.getRandom(self.wrkMsg))
                choice = input("Take a break? (y/n): ").strip().lower()
                # Record the break decision
                self.user_inputs["session responses"].append({"prompt": "Take Break", "Ans": choice})

                if choice == 'y':    
                    print("\n" + self.getRandom(self.brkMsg))
                    time.sleep(self.brksecs)
        

                print("\n" + self.getRandom(self.retMsg))
                cont = input("Start another session? (y/n): ").strip().lower()
                # Record the restart decision

                self.user_inputs["session responses"].append({"prompt": "Restart cycle", "Ans": cont})
                if cont != "y":
                    break
        finally:
            self.saveJson()

    def saveJson(self):
        with open("session_log.json", "w") as f:
            json.dump(self.user_inputs, f, indent=4)
        print("\n[System] Data saved to session_log.json")



def main():
    work = int(input("How long do you want to work for (minutes): "))
    brk = int(input("How long do you want your breaks (minutes): "))

    reminder = BrkRmndr(work, brk)

    print("Session Config:", json.dumps(reminder.user_inputs, indent=4))

    reminder.activate()

if __name__ == "__main__":
    main()
