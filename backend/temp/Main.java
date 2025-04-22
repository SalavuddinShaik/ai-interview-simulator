#include <iostream>

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

class Solution {
public:
    void flattenBinaryTreeToLinkedList(TreeNode* root) {
        if (!root) return;  // Base case: if the root is null, do nothing

        // Flatten the left and right subtrees recursively
        if (root->left) {
            flattenBinaryTreeToLinkedList(root->left);  // Flatten the left subtree
            TreeNode* tempRight = root->right;  // Save the original right subtree
            root->right = root->left;  // Move the left subtree to the right
            root->left = NULL;  // Set the left child to null

            // Now find the rightmost node of the new right subtree
            TreeNode* rightmost = root->right;
            while (rightmost->right) {
                rightmost = rightmost->right;  // Traverse to the rightmost node
            }

            // Attach the original right subtree to the rightmost node
            rightmost->right = tempRight;
        }

        // Now, flatten the right subtree recursively (it may already be flattened)
        flattenBinaryTreeToLinkedList(root->right);
    }
};

// Helper function to print the flattened tree
void printFlattenedTree(TreeNode* root) {
    while (root) {
        std::cout << root->val << " ";
        root = root->right;
    }
    std::cout << std::endl;
}

// Example Usage:
int main() {
    Solution solution;
    
    // Creating the example tree:
    TreeNode* root = new TreeNode(1);
    root->left = new TreeNode(2);
    root->right = new TreeNode(5);
    root->left->left = new TreeNode(3);
    root->left->right = new TreeNode(4);
    root->right->right = new TreeNode(6);

    // Flatten the binary tree
    solution.flattenBinaryTreeToLinkedList(root);

    // Print the flattened tree
    printFlattenedTree(root);  // Output should be: 1 2 3 4 5 6 

    return 0;
}
