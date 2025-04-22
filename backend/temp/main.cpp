#include <iostream>
#include <vector>
#include <utility>
using namespace std;

vector<pair<int, int> > oceanViewCells(const vector<vector<int> >& matrix) {
    int m = matrix.size();
    if (m == 0) return {};
    int n = matrix[0].size();
    vector<pair<int, int> > result;
    vector<int> colMax(n, INT_MIN);

    for (int i = 0; i < m; ++i) {
        int rowMax = INT_MIN;
        for (int j = 0; j < n; ++j) {
            if (i == 0 || j == 0 ||
                (matrix[i][j] > rowMax && matrix[i][j] > colMax[j])) {
                result.push_back(make_pair(i, j));
            }
            rowMax = max(rowMax, matrix[i][j]);
            colMax[j] = max(colMax[j], matrix[i][j]);
        }
    }

    return result;
}

int main() {
    vector<vector<int> > matrix = {
        {3, 4, 5},
        {2, 3, 6},
        {1, 2, 4}
    };

    vector<pair<int, int> > res = oceanViewCells(matrix);

    for (auto& p : res) {
        cout << "(" << p.first << ", " << p.second << ") ";
    }
    cout << endl;

    return 0;
}
