from typing import List

def process_stack_operations(operations: List[int]) -> List[int]:
    stack = []
    for op in operations:
        if op > 0:
            stack.append(op)  # Push positive numbers
        elif op < 0:
            if stack:
                stack.pop()  # Pop only if stack is not empty
    return stack
