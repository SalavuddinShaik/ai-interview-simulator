class MajorityElementFinder {
    public static int findMajorityElement(int[] nums) {
        int count = 0;
        int candidate = 0;

        for (int num : nums) {
            if (count == 0) {
                candidate = num;
            }
            count += (num == candidate) ? 1 : -1;
        }

        return candidate;
    }
}

public class Main {
    public static void main(String[] args) {
        int[] nums = {3, 2, 3};
        int result = MajorityElementFinder.findMajorityElement(nums);
        System.out.println("Majority element: " + result);
    }
}