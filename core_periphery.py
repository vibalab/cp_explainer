import numpy as np
from scipy.stats import pearsonr
import networkx as nx

class Stochastic_Block_Model:
    def __init__(self, G, A):
        """
        Initialize the SBM class with the adjacency matrix.
        :param A: Adjacency matrix
        """
        self.G = G
        self.A = A

    def create_core_periphery_matrix(self, n, core_indices):
        """
        Create the ideal core-periphery matrix Δ.
        :param n: Number of nodes
        :param core_indices: List of indices that are part of the core
        :return: Core-periphery matrix Δ
        """
        Δ = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if i in core_indices or j in core_indices:
                    Δ[i, j] = 1
        return Δ

    def borgatti_everett_correlation(self, core_indices):
        """
        Calculate the Borgatti and Everett correlation ρ.
        :param core_indices: List of indices that are part of the core
        :return: Correlation ρ
        """
        n = self.A.shape[0]
        Δ = self.create_core_periphery_matrix(n, core_indices)
        A_flat = self.A.flatten()
        Δ_flat = Δ.flatten()
        ρ, _ = pearsonr(A_flat, Δ_flat)
        return ρ

    def brusco_metric(self, core_indices):
        """
        Calculate the Brusco metric Z(A, c).
        :param core_indices: List of indices that are part of the core
        :return: Brusco metric Z(A, c)
        """
        n = self.A.shape[0]
        periphery_indices = [i for i in range(n) if i not in core_indices]

        core_core_edges = 0
        periphery_periphery_edges = 0

        for i in range(n):
            for j in range(i + 1, n):
                if i in core_indices and j in core_indices:
                    if self.A[i, j] == 1:
                        core_core_edges += 1
                if i in periphery_indices and j in periphery_indices:
                    if self.A[i, j] == 0:
                        periphery_periphery_edges += 1

        return core_core_edges + periphery_periphery_edges

    def fitness_function_borgatti_everett(self, ga_instance, solution, solution_idx):
        """
        Fitness function to maximize the Borgatti and Everett correlation ρ.
        :param ga_instance: Instance of the PyGAD.GA class
        :param solution: Solution (core_indices encoded as a list of floats)
        :param solution_idx: Index of the solution
        :return: Fitness value
        """
        core_indices = [i for i, gene in enumerate(solution) if gene > 0.5]
        if not core_indices:  # Ensure there is at least one core index
            return -1
        ρ = self.borgatti_everett_correlation(core_indices)
        return ρ if np.isfinite(ρ) else -1

    def fitness_function_brusco_metric(self, ga_instance, solution, solution_idx):
        """
        Fitness function to maximize the Brusco metric.
        :param ga_instance: Instance of the PyGAD.GA class
        :param solution: Solution (core_indices encoded as a list of floats)
        :param solution_idx: Index of the solution
        :return: Fitness value
        """
        core_indices = [i for i, gene in enumerate(solution) if gene > 0.5]
        if not core_indices:  # Ensure there is at least one core index
            return -1
        Z = self.brusco_metric(core_indices)
        return Z if np.isfinite(Z) else -1
    





class Transport :
    def __init__(self, G, A) :
        self.G = G
        self.A = A

        
    def closeness_centrality(self, G, U):
        """
        Calculate the closeness centrality for a subset U of nodes in graph G.
        """
        A = nx.to_numpy_array(G)
        n = A.shape[0]
        n_U = len(U)
        if n_U == 0:
            return 0
        
        total_distance = 0
        for i in U:
            shortest_paths = nx.single_source_shortest_path_length(G, i)
            total_distance += sum(shortest_paths[j] for j in U if i != j and j in shortest_paths)
        
        
        if total_distance == 0:
            return 0
        
        return (1 / (n_U * (n - 1))) / total_distance




    def find_best_k_core(self,G):
        """
        Find the k-core that maximizes the closeness centrality.
        """
        best_k_core = None
        max_closeness = -1
        
        k = 1
        while True:
            k_core = nx.k_core(G, k)
            if k_core.number_of_nodes() == 0:
                break
            k_core_nodes = list(k_core.nodes)
            cc = self.closeness_centrality(G, k_core_nodes)
            if cc > max_closeness:
                max_closeness = cc
                best_k_core = k_core_nodes
            k += 1
        
        return best_k_core

    def holme_metric(self, G, n_iter):
        """
        Calculate the CP metric for graph G with the best k-core.
        """
        V = set(G.nodes)
        C_C_V = self.closeness_centrality(G, V)
        
        if C_C_V == 0:
            return 0
        
        best_k_core_nodes = self.find_best_k_core(G)

        C_C_core = self.closeness_centrality(G, best_k_core_nodes)
        
        core_centrality = C_C_core / C_C_V
        
        sum_random = []
        for i in range(n_iter):
            degree_sequence = [d for n, d in G.degree()]
            G_random = nx.configuration_model(degree_sequence)
            G_random = nx.Graph(G_random)
            G_random.remove_edges_from(nx.selfloop_edges(G_random))
            C_C_V_prime = self.closeness_centrality(G_random, set(G_random.nodes))
            best_k_core_nodes_prime = self.find_best_k_core(G_random)
            C_C_prime = self.closeness_centrality(G_random, best_k_core_nodes_prime)

            core_centrality_prime = C_C_prime / C_C_V_prime
            sum_random.append(core_centrality_prime)
        
        G_prime_average = np.mean(sum_random)
        
        c_cp = core_centrality - G_prime_average
        
        return c_cp, best_k_core_nodes
    


    def get_capacity(self, G):
        """
        Calculate the capacity of the network.
        """
        total_capacity = 0
        for i in G.nodes:
            shortest_paths = nx.single_source_shortest_path_length(G, i)
            for j in G.nodes:
                if i != j and j in shortest_paths:
                    total_capacity += 1 / shortest_paths[j]
        total_capacity /= 2  # Since each pair is counted twice
        return total_capacity

    def silva_core_coefficient(self, G):
        """
        Calculate the core coefficient of the network and return the core nodes and capacity changes.
        """
        # Calculate the closeness centrality of each node
        closeness = nx.closeness_centrality(G)
        
        # Sort nodes by closeness centrality in decreasing order
        sorted_nodes = sorted(closeness, key=closeness.get, reverse=True)
        
        # Initialize variables
        cumulative_capacity = 0
        N = len(G.nodes)
        removed_nodes = []
        G_removed = G.copy()
        capacity = [self.get_capacity(G)]
        
        # Calculate capacities after removing nodes in order
        for i, node in enumerate(sorted_nodes):
            # Remove the node and calculate the new capacity
            G_removed.remove_node(node)
            new_capacity = self.get_capacity(G_removed)
            capacity.append(new_capacity)
            
            # Add the new capacity to the cumulative capacity
            cumulative_capacity += new_capacity
            
            # Add the node to the removed nodes list
            removed_nodes.append(node)
        
        # Calculate the core coefficient
    
        n = 1
        while True:
            if np.sum(capacity[:n]) > cumulative_capacity*0.9:
                break
            else:
                n += 1
        
        cc = (N-n) / N
        
        # Calculate the changes in capacity and map to sorted nodes
        capacities = {sorted_nodes[i]: capacity[i] for i in range(len(sorted_nodes))}

        return cc, removed_nodes[:n], capacities
    

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

    def _calculate_alpha(self):
        sigma = np.array(self.G.degree())[:, 1]
        idx = np.random.choice(np.flatnonzero(sigma == sigma.min()))
        self.P = [idx]
        self.alpha[idx] = 0

        for k in range(1, self.N):
            min_val = np.inf
            min_idx = -1

            for j in range(self.N):
                if j in self.P:
                    continue

                num1 = np.sum([self.pi[p1] * self.m[p1, p2] for p1 in self.P for p2 in self.P])
                num2 = np.sum([self.pi[p] * self.m[p, j] + self.pi[j] * self.m[j, p] for p in self.P])
                denom = np.sum([self.pi[p] for p in self.P]) + self.pi[j]

                alpha_candidate = (num1 + num2) / denom

                if alpha_candidate < min_val:
                    min_val = alpha_candidate
                    min_idx = j

            self.P.append(min_idx)
            self.alpha[min_idx] = min_val

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


class Minre :
    def __init__(self, G, A):
        """
        Initialize the SBM class with the adjacency matrix.
        :param A: Adjacency matrix
        """
        self.G = G
        self.A = A


    def normalize_w(self, w):
        """
        코어니스 벡터 w를 정규화하여 반환하고, 0~1 범위로 스케일링합니다.

        Parameters
        ----------
        w : ndarray
            n 차원의 코어니스 벡터.

        Returns
        -------
        w_scaled : ndarray
            정규화된 후 0~1로 스케일링된 코어니스 벡터.
        """
        # 정규화
        norm_factor = np.sqrt(np.sum(w ** 2))
        w_normalized = w / norm_factor

        # 0~1로 스케일링
        w_min = np.min(w_normalized)
        w_max = np.max(w_normalized)
        w_scaled = (w_normalized - w_min) / (w_max - w_min)

        return w_scaled

    def calculate_pre(self, A, w):
        n = A.shape[0]
        
        # ww^T 계산
        wwT = np.outer(w, w)
        
        # A의 비대각선 평균 계산
        mean_A = np.mean(A[np.triu_indices(n, k=1)])
        A_bar = np.full(A.shape, mean_A)
        
        # SS(A - ww^T) 계산 (비대각선에 대해서만)
        residual_ss = np.sum((A[np.triu_indices(n, k=1)] - wwT[np.triu_indices(n, k=1)]) ** 2)
        
        # SS(A - A_bar) 계산 (비대각선에 대해서만)
        total_ss = np.sum((A[np.triu_indices(n, k=1)] - A_bar[np.triu_indices(n, k=1)]) ** 2)
        
        # PRE 계산
        pre = 1 - (residual_ss / total_ss)
        
        return pre

    def minres(self, tol=1e-5, max_iter=10000, learning_rate=0.001):
        """
        MINRES 알고리즘을 사용하여 행렬 A에 대해 w를 구함.

        Parameters
        ----------
        A : ndarray
            n x n 데이터 행렬.
        tol : float, optional
            수렴 허용 오차, 기본값은 1e-5.
        max_iter : int, optional
            최대 반복 횟수, 기본값은 1000.
        learning_rate : float, optional
            기울기 하강법의 학습률, 기본값은 0.01.

        Returns
        -------
        w : ndarray
            n 차원의 벡터, 코어니스 값.
        PRE : float
            비율 오차 감소(Proportional Reduction of Error).
        """
        A = self.A
        n = A.shape[0]
        w = np.random.rand(n)  # w의 초기값은 랜덤으로 설정

        for _ in range(max_iter):
            gradient = np.zeros(n)
            for i in range(n):
                for j in range(n):
                    if i != j:
                        gradient[i] += -2 * (A[i, j] - w[i] * w[j]) * w[j]

            w_new = w - learning_rate * gradient

            if np.linalg.norm(w_new - w) < tol:
                break

            w = w_new

        self.PRE = self.calculate_pre(A, w)
        self.w = self.normalize_w(w)
        self.indices = np.where(self.w > 0.8)[0]
        return self.w, self.indices, self.PRE
    
