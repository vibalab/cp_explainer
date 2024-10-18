import numpy as np
import networkx as nx
import numba

class Rossa:
    def __init__(self, G):
        self.G = G
        self.N = G.number_of_nodes()
        self.alpha = np.zeros(self.N)
        self.cp_centralization = 0
        self.pi = None
        self.m = None
        self.P = []

        self._initialize_matrices()
        self._calculate_alpha()
        self._calculate_cp_centralization()

    def _initialize_matrices(self):
        A = nx.to_numpy_array(self.G)
        A = np.where(A != 0, 1, 0)
        sigma = np.array(A.sum(axis=0)).reshape(-1)
        self.pi = sigma / np.sum(sigma)  # Normalize the sigma values to get pi
        self.m = np.zeros((self.N, self.N))

        for i in range(self.N):
            for j in range(self.N):
                if A[i, j] != 0:
                    self.m[i, j] = A[i, j] / np.sum(A[i])

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def _calculate_alpha_numba(N, P, alpha, pi, m):
        for k in range(1, N):
            min_val = np.inf
            min_idx = -1

            for j in range(N):
                if j in P:
                    continue

                num1 = np.sum(np.array([pi[p1] * m[p1, p2] for p1 in P for p2 in P]))
                num2 = np.sum(np.array([pi[p] * m[p, j] + pi[j] * m[j, p] for p in P]))
                denom = np.sum(np.array([pi[p] for p in P])) + pi[j]

                # ZeroDivisionError 방지: denom이 0인 경우 처리
                if denom == 0:
                    continue  # denom이 0이면 이 후보를 건너뜁니다

                alpha_candidate = (num1 + num2) / denom

                if alpha_candidate < min_val:
                    min_val = alpha_candidate
                    min_idx = j

            P.append(min_idx)
            alpha[min_idx] = min_val

        return P, alpha

    def _calculate_alpha(self):
        sigma = np.array([degree for _, degree in self.G.degree()], dtype=np.int32)
        idx = np.random.choice(np.flatnonzero(sigma == sigma.min()))
        self.P = [idx]
        self.alpha[idx] = 0

        # Apply Numba-optimized function
        self.P, self.alpha = self._calculate_alpha_numba(self.N, self.P, self.alpha, self.pi, self.m)

    def _calculate_cp_centralization(self):
        alpha_sum = np.sum(self.alpha) - 1
        self.cp_centralization = 1 - (2 / (self.N - 2)) * alpha_sum

    def get_alpha(self):
        return self.alpha

    def get_cp_centralization(self):
        return self.cp_centralization

    def randomize_network(self):
        random_G = self.G.copy()
        nx.double_edge_swap(random_G, nswap=2*self.G.number_of_edges(), max_tries=10000)
        return random_G

    def calculate_z_score(self, num_randomizations=100):
        random_cp_centralizations = []

        for _ in range(num_randomizations):
            random_G = self.randomize_network()
            random_analyzer = Rossa(random_G)
            random_cp_centralizations.append(random_analyzer.get_cp_centralization())

        mean_random_cp = np.mean(random_cp_centralizations)
        std_random_cp = np.std(random_cp_centralizations)

        z_score = (self.cp_centralization - mean_random_cp) / std_random_cp
        return z_score
    
    def extract_core_nodes(self, threshold):
        core_nodes = [i for i, alpha_value in enumerate(self.alpha) if alpha_value >= threshold]
        return core_nodes

