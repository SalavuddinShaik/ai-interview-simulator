from queue import Queue

class MyStack:

    def __init__(self):
        # Initialize two queues
        self.q1 = Queue()
        self.q2 = Queue()

    def push(self, x: int) -> None:
        # Always push into q1
        self.q1.put(x)

    def pop(self) -> int:
        # Transfer all elements except the last one from q1 to q2
        while self.q1.qsize() > 1:
            self.q2.put(self.q1.get())

        # The last element in q1 is the top of the stack
        top_element = self.q1.get()

        # Swap q1 and q2 to continue the process
        self.q1, self.q2 = self.q2, self.q1

        return top_element

    def top(self) -> int:
        # We can reuse the pop process to get the top element, and then push it back
        top_element = self.pop()
        self.push(top_element)
        return top_element

    def empty(self) -> bool:
        # Check if both queues are empty
        return self.q1.empty()
