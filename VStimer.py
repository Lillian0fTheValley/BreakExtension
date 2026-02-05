import time
import random

class BrkRmndr:
    def __init__ (self, wrkmins, brkmins) -> None:
        self.wrksecs = wrkmins * 60
        self.brksecs = brkmins * 60
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
        while True:
            time.sleep(self.wrksecs)

            print("\n" + self.getRandom(self.wrkMsg))
            choice = input("Take a break? (y/n): ").strip().lower()

            if choice == 'y':    
                print("\n" + self.getRandom(self.brkMsg))
                time.sleep(self.brksecs)
        

            print("\n" + self.getRandom(self.retMsg))
            cont = input("Start another session? (y/n): ").strip().lower()

            if cont != "y":
                break


def main():
    work = int(input("How long do you want to work for (minutes): "))
    brk = int(input("How long do you want your breaks (minutes): "))

    reminder = BrkRmndr(work, brk)
    reminder.activate()

if __name__ == "__main__":
    main()
