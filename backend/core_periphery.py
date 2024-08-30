import numpy as np
from scipy.stats import pearsonr
import networkx as nx
from simanneal import Annealer
import random
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from scipy.stats import gaussian_kde
from scipy.sparse.linalg import eigs
import itertools
import math
import numba

class Stochastic_Block_Model:
    def __init__(self, G, A):
        self.G = G
        self.A = A

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def create_core_periphery_matrix(n, core_indices):
        delta = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if i in core_indices or j in core_indices:
                    delta[i, j] = 1
        return delta

    def borgatti_everett_correlation(self, core_indices):
        n = self.A.shape[0]
        delta = self.create_core_periphery_matrix(n, core_indices)
        A_flat = self.A.flatten()
        delta_flat = delta.flatten()
        # pearsonr은 Numba가 지원하지 않으므로 여기에서 사용
        rho, _ = pearsonr(A_flat, delta_flat)
        return rho

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def calculate_brusco_metric(A, n, core_indices, periphery_indices):
        core_core_edges = 0
        periphery_periphery_edges = 0

        for i in range(n):
            for j in range(i + 1, n):
                if i in core_indices and j in core_indices:
                    if A[i, j] == 1:
                        core_core_edges += 1
                if i in periphery_indices and j in periphery_indices:
                    if A[i, j] == 0:
                        periphery_periphery_edges += 1

        return core_core_edges + periphery_periphery_edges

    def brusco_metric(self, core_indices):
        n = self.A.shape[0]
        periphery_indices = [i for i in range(n) if i not in core_indices]
        return self.calculate_brusco_metric(self.A, n, core_indices, periphery_indices)

    def fitness_function_borgatti_everett(self, ga_instance, solution, solution_idx):
        core_indices = [i for i, gene in enumerate(solution) if gene > 0.5]
        if not core_indices:
            return -1
        rho = self.borgatti_everett_correlation(core_indices)
        return rho if np.isfinite(rho) else -1

    def fitness_function_brusco_metric(self, ga_instance, solution, solution_idx):
        core_indices = [i for i, gene in enumerate(solution) if gene > 0.5]
        if not core_indices:
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
        r_nodes= list(self.G.nodes())
        r_index = [r_nodes.index(i) for i in best_k_core_nodes]

        return c_cp, r_index
    


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

        r_nodes= list(self.G.nodes())
        r_index = [r_nodes.index(i) for i in removed_nodes[:n]]

        return cc, r_index, capacities
    

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



class Minre:
    def __init__(self, G, A):
        self.G = G
        self.A = A

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def normalize_w(w):
        norm_factor = np.sqrt(np.sum(w ** 2))
        w_normalized = w / norm_factor
        w_min = np.min(w_normalized)
        w_max = np.max(w_normalized)
        w_scaled = (w_normalized - w_min) / (w_max - w_min)
        return w_scaled

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def calculate_pre(A, w):
        n = A.shape[0]
        
        # ww^T 계산
        wwT = np.outer(w, w)

        # 비대각선 요소들만 합산하기 위해 직접 반복문을 사용
        total_ss = 0.0
        residual_ss = 0.0
        mean_A = 0.0
        count = 0

        for i in range(n):
            for j in range(i + 1, n):
                mean_A += A[i, j]
                count += 1

        mean_A /= count

        for i in range(n):
            for j in range(i + 1, n):
                total_ss += (A[i, j] - mean_A) ** 2
                residual_ss += (A[i, j] - wwT[i, j]) ** 2
        
        pre = 1 - (residual_ss / total_ss)
        return pre

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def minres_algorithm(A, tol, max_iter, learning_rate):
        n = A.shape[0]
        w = np.random.rand(n)

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

        return w

    def minres(self, tol=1e-5, max_iter=10000, learning_rate=0.001, cutoff = 0.5):
        A = self.A
        w = self.minres_algorithm(A, tol, max_iter, learning_rate)
        self.PRE = self.calculate_pre(A, w)
        self.w = self.normalize_w(w)
        self.indices = np.where(self.w > cutoff)[0]
        return self.w, self.indices, self.PRE
    

    

class Lip :
    def __init__(self, G, A) :
        self.G = G
        self.A = A

    
    def calculate(self) :
        A = self.A
        n = A.shape[0]
        deg = A.sum(axis=1)
        sorted_indices = np.argsort(-deg)
        Z_best = np.inf
        k_best = 0
        Z_influence = np.zeros(n)

        # Z의 초기값을 설정
        Z = 0.5 * deg.sum()
        for k in range(1, n):
            v_k = sorted_indices[k-1]
            Z_influence[v_k] = k - 1 - deg[v_k]
            Z += Z_influence[v_k]
            
            if Z < Z_best:
                Z_best = Z
                k_best = k
        S1 = sorted_indices[:k_best]
        return Z_influence, S1, Z_best
    

class Rombach:
    def __init__(self, graph, A, alpha = 0.5, beta = 0.8):
        self.G = graph
        self.A = A
        self.alpha = alpha
        self.beta = beta

    def transition_function(self, i, N, alpha, beta):
        """전이 함수 g_{alpha, beta}(i)를 구현합니다."""
        if i <= int(beta * N):
            return i * (1 - alpha) / ((beta * N) * 2)
        else:
            return (((i - beta * N) * (1 - alpha)) / (2 * (N - beta * N))) + ((1 + alpha) / 2)

    def calculate_core_quality(self, A, C):
        """코어 품질 R_{alpha, beta}를 계산합니다."""
        return np.sum(A * np.outer(C, C))

    def find_optimal_core_vector(self, A, alpha, beta):
        """최적의 코어 벡터 C*를 찾습니다."""
        N = A.shape[0]
        C_star = np.array([self.transition_function(i, N, alpha, beta) for i in range(1, N + 1)])
        return C_star

    def aggregate_core_score(self, A, alpha_values, beta_values):
        """각 노드의 코어 점수 CS(i)를 계산합니다."""
        N = A.shape[0]
        core_scores = np.zeros(N)
        Z = 0  # 정규화 인자

        for alpha in alpha_values:
            for beta in beta_values:
                C_star = self.find_optimal_core_vector(A, alpha, beta)
                R_gamma = self.calculate_core_quality(A, C_star)
                core_scores += C_star * R_gamma
                Z = max(Z, np.max(core_scores))

        core_scores /= Z  # 정규화
        return core_scores, R_gamma

    class NodeOrderAnnealer(Annealer):
        def __init__(self, state, A, alpha, beta, parent):
            self.A = A
            self.alpha = alpha
            self.beta = beta
            self.parent = parent
            self.steps = 10000  # 총 단계 수
            self.Tmax = 1  # 초기 온도
            self.Tmin = 1e-8  # 최종 온도
            super().__init__(state)  # 초기 상태 설정

        def default_update(self, step, T, E, acceptance, improvement):
            """Silent update, does not output anything."""
            pass


        def move(self):
            """임의의 두 노드를 스왑하여 이웃 상태를 생성합니다."""
            a = np.random.randint(0, len(self.state))
            b = np.random.randint(0, len(self.state))
            self.state[a], self.state[b] = self.state[b], self.state[a]

        def energy(self):
            """현재 상태의 에너지를 계산합니다 (코어 품질의 음수)."""
            order = self.state
            A_ordered = self.A[order][:, order]
            core_vector = self.parent.find_optimal_core_vector(A_ordered, self.alpha, self.beta)
            core_quality = self.parent.calculate_core_quality(A_ordered, core_vector)
            return -core_quality  # 코어 품질의 음수를 에너지로 사용

    def optimize(self):
        # 초기 상태 (노드 순서)
        initial_state = list(np.arange(self.A.shape[0]))

        # Annealer 생성
        annealer = self.NodeOrderAnnealer(initial_state, self.A, self.alpha, self.beta, self)

        # 최적화 수행
        best_state, best_energy = annealer.anneal()

        # 결과 적용
        best_order = best_state
        A_optimized = self.A[best_order][:, best_order]
        core_scores_optimized, R_gamma = self.aggregate_core_score(A_optimized, [self.alpha], [self.beta])
        core_nodes = np.where(core_scores_optimized > 0.7)[0]
        result = [best_order[i] for i in core_nodes]

        core_scores_reordered = np.zeros(self.A.shape[0])
        j = 0
        for i in best_order :
            core_scores_reordered[i] = core_scores_optimized[j]
            j+=1


        core_scores_optimized = [core_scores_optimized[i] for i in best_order]

        return best_order, core_scores_reordered, result, R_gamma
    

class KM_ER :
    def __init__(self, G, A) :
        self.G = G
        self.A = A
        self.p = self.calculate_density(G)


    def B_c_x_matrix(self, c, x):
        """
        Constructs the idealized core-periphery adjacency matrix B(c,x) for given c.
        """
        N = len(x)
        B = np.zeros((N, N))
        for i in range(N):
            for j in range(i+1, N):
                if (x[i] == 1 or x[j] == 1) and c[i] == c[j]:
                    B[i, j] = B[j, i] = 1
        return B

    def calculate_density(self, graph):
        """
        Calculate the density of a given graph.
        
        Parameters:
        - graph: A NetworkX graph object.
        
        Returns:
        - p: The density of the graph.
        """
        N = graph.number_of_nodes()
        M = graph.number_of_edges()
        if N <= 1:
            return 0  # Avoid division by zero when N is 0 or 1
        max_edges = N * (N - 1) / 2
        p = M / max_edges
        return p

    def Q_cp(self, c, x, p):
        """
        The objective function Q_cp(c, x) to be maximized.
        """
        A = self.A
        B_c_x = self.B_c_x_matrix(c, x)
        N = len(x)
        Q_cp_value = 0
        q = np.zeros(len(np.unique(c)))
        for i in range(N):
            for j in range(i):
                q[c[i]] += (A[i, j] - p) * B_c_x[i, j]
                Q_cp_value += (A[i, j] - p) * B_c_x[i, j]
        return Q_cp_value, q

    def c_initialize(self):
        """
        Initialize c and x arrays.
        """
        N = self.G.number_of_nodes()
        c = np.arange(N)
        x = np.ones(N)
        return c, x

    def kronecker_delta(self, a, b):
        return 1 if a == b else 0

    def update_Q_cp(self, i, c, x, c_prime, x_prime, p, d_tilde, N_tilde):
        """
        Calculate the increment in Q_cp by changing node i's label from (c,x) to (c',x').
        """

        delta_Q_cp = (
            d_tilde[c_prime, 1] + x_prime * d_tilde[c_prime, 0] - 
            p * (N_tilde[c_prime, 1] + x_prime * N_tilde[c_prime, 0] - self.kronecker_delta(c[i], c_prime))
        ) - (
            d_tilde[c[i], 1] + x[i] * d_tilde[c[i], 0] - 
            p * (N_tilde[c[i], 1] + x[i] * N_tilde[c[i], 0] - x[i])
        )
        
        return delta_Q_cp

    def relabel_assignments(self, c):
        """
        Relabel the core-periphery assignments so that they are consecutive integers starting from 0.
        
        Parameters:
        - c: Original core-periphery assignments.
        
        Returns:
        - relabeled_c: Relabeled core-periphery assignments with consecutive integers.
        """
        # Use pandas to get unique values and map them to consecutive integers
        unique_labels = pd.Series(c).unique()
        relabel_map = {old_label: new_label for new_label, old_label in enumerate(unique_labels)}
        
        # Apply the mapping
        relabeled_c = np.array([relabel_map[label] for label in c])
        
        return relabeled_c

    def optimize(self, max_updates=1000):
        """
        Maximize Q_cp using label switching heuristic with a limit on the number of updates.
        """
        c, x = self.c_initialize()
        N = self.G.number_of_nodes()
        A = self.A
        p = self.p
        updates = 0

        r_nodes = list(self.G.nodes)
        for _ in range(max_updates):
            if updates >= max_updates:
                break
            
            nodes = list(range(N))
            random.shuffle(nodes)  # Scan nodes in random order
            
            for i in nodes:
                best_delta_Q = 0
                best_c, best_x = c[i], x[i]
                di = self.G.degree[r_nodes[i]]  # Degree of node i
                evaluations = 0  # To count the number of evaluations for this node

                
                d_tilde = np.zeros((N, 2))  # d_tilde[i][0] for x=0, d_tilde[i][1] for x=1
                N_tilde = np.zeros((N, 2))  # N_tilde[c][0] for x=0, N_tilde[c][1] for x=1
                
                for j in range(N):
                    if i != j:
                        d_tilde[c[j], int(x[j])] += A[i, j]
                        N_tilde[c[j], int(x[j])] += 1

                # Check all neighbors of i, but limit to 2di evaluations
                for j in self.G.neighbors(r_nodes[i]):
                    if evaluations >= 2 * di:
                        break
                    neighbor_index = r_nodes.index(j)
                    for new_x in [0, 1]:
                        if evaluations >= 2 * di:
                            break
                        

                        delta_Q = self.update_Q_cp(i, c, x, c[neighbor_index], new_x, p, d_tilde, N_tilde)
                        evaluations += 1
                        
                        if delta_Q > best_delta_Q:
                            best_delta_Q = delta_Q
                            best_c, best_x = c[neighbor_index], new_x

                # Update (ci, xi) if it improves Q_cp
                if best_delta_Q > 0:
                    c[i], x[i] = best_c, best_x
                    updates += 1  # Increment the update counter
                    
                if updates >= max_updates:
                    break  # Stop further updates if the limit is reached
        c = self.relabel_assignments(c)
        Qcp, Qc = self.Q_cp(c, x, p) 

        return c, x, Qcp, Qc
    

    def visualize_core_periphery(self, c, x):
        """
        Visualize the core-periphery structure on the given graph.
        
        Parameters:
        - graph: A NetworkX graph object.
        - c: Core-periphery assignments (list).
        - x: Core-periphery labels (list).
        """
        pos = nx.spring_layout(self.G)  # Position nodes using Fruchterman-Reingold force-directed algorithm
        
        # Generate a color map for the different 'c' values
        unique_c_values = sorted(set(c))
        colors = plt.cm.get_cmap('hsv', len(unique_c_values))
        color_map = {val: colors(i) for i, val in enumerate(unique_c_values)}
        
        r_nodes = list(self.G.nodes)
        for i in range(len(c)):
            node_color = 'white' if x[i] == 0 else color_map[c[i]]
            nx.draw_networkx_nodes(
                self.G, pos, nodelist=[r_nodes[i]], 
                node_color=node_color, 
                edgecolors=color_map[c[i]], 
                linewidths=2, 
                node_size=500
            )

        # Draw edges
        nx.draw_networkx_edges(self.G, pos)
        
        # Draw labels
        nx.draw_networkx_labels(self.G, pos)
        
        # Display the plot
        plt.title('Core-Periphery Structure with Grouped Outlines')
        plt.show()

    def calculate_Q_cp_BE(self, A, B, p, alpha=0.5):
        N = A.shape[0]  # Number of nodes
        
        # Mean values
        P_B = np.sum(B) / (N * (N - 1) / 2)
        
        # Numerator: Sum over all pairs (i, j)
        numerator = 0
        for i in range(N):
            for j in range(i):
                numerator += (A[i, j] - p) * (B[i, j] - P_B)
        
        # Denominator: Square root of product of sums
        sum_A_diff_sq = np.sum([(A[i, j] - p) ** 2 for i in range(N) for j in range(i)])
        sum_B_diff_sq = np.sum([(B[i, j] - P_B) ** 2 for i in range(N) for j in range(i)])
        denominator = np.sqrt(sum_A_diff_sq * sum_B_diff_sq)
        
        if denominator == 0:
            return 0  # To avoid division by zero
        
        Q_cp_BE = numerator / denominator
        
        return alpha * Q_cp_BE

    def create_B_matrix(self, c, x, core_id, N):
        """
        Create the ideal core-periphery matrix B(x) for a specific core-periphery pair.
        
        Parameters:
        - c: Core-periphery assignments (array indicating the core).
        - x: Core-periphery labels (array indicating core(1) or periphery(0)).
        - core_id: The specific core-periphery pair ID to focus on.
        - N: Total number of nodes.
        
        Returns:
        - B: The ideal core-periphery adjacency matrix for the specific pair.
        """
        B = np.zeros((N, N))
        for i in range(N):
            for j in range(i + 1, N):
                if c[i] == core_id and c[j] == core_id:
                    if x[i] == 1 or x[j] == 1:
                        B[i, j] = B[j, i] = 1
        return B

    def sidak_correction(self, alpha, C):
        """
        Apply the Šidák correction to the significance level.
        
        Parameters:
        - alpha: The overall significance level.
        - C: The number of core-periphery pairs.
        
        Returns:
        - alpha_sidak: The adjusted significance level for each test.
        """
        alpha_sidak = 1 - (1 - alpha)**(1 / C)
        return alpha_sidak

    def calculate_multi_core_Q_cp_BE(self, c, x, alpha=0.01):
        """
        Calculate the Q^cp_BE value for multiple core-periphery pairs considering Šidák correction.
        
        Parameters:
        - c: Core-periphery assignments (array indicating the core).
        - x: Core-periphery labels (array indicating core(1) or periphery(0)).
        - alpha: The overall significance level.
        
        Returns:
        - significant_cores: List of core IDs that are significant after Šidák correction.
        - total_Q_cp_BE: Total Q^cp_BE value for the network considering all core-periphery pairs.
        """
        A = self.A
        total_Q_cp_BE = 0
        significant_cores = []
        unique_core_ids = np.unique(c)
        N = A.shape[0]
        p = np.sum(A) / (N * (N - 1))  # Network density
        
        # Apply Šidák correction
        alpha_sidak = self.sidak_correction(alpha, len(unique_core_ids))

        for core_id in unique_core_ids:
            B = self.create_B_matrix(c, x, core_id, N)
            Q_cp_BE = self.calculate_Q_cp_BE(A, B, p, alpha_sidak)
            total_Q_cp_BE += Q_cp_BE

            # Check significance of each core-periphery pair
            if Q_cp_BE <= alpha_sidak:  # Significance test with Šidák-corrected alpha
                significant_cores.append(core_id)
        
        return significant_cores, total_Q_cp_BE


class KM_Config :
    def __init__(self, G, A) :
        self.G = G
        self.A = A


    def compute_D(self, degrees, c, x):
        """
        Compute the sum of degrees of nodes in each block (c, x).
        """
        D = np.zeros((max(c) + 1, 2))
        r_nodes = list(self.G.nodes)
        for node in degrees:
            D[c[r_nodes.index(node)], int(x[r_nodes.index(node)])] += degrees[node]
        return D

    def compute_Q_cp_config(self, c, x):
        """
        Calculate Q_cp_config based on the given formula.

        Parameters:
        graph (networkx.Graph): The input graph.
        c (list): Community assignments for each node.
        x (list): External/internal assignments for each node.

        Returns:
        float: The calculated Q_cp_config value.
        """
        N = self.G.number_of_nodes()
        M = self.G.number_of_edges()
        A = nx.to_numpy_array(self.G)
        degrees = dict(self.G.degree())
        r_nodes = list(self.G.nodes)
        Q_cp_config = 0
        
        for i in range(N):
            for j in range(N):
                A_ij = A[i, j]
                d_i = degrees[r_nodes[i]]
                d_j = degrees[r_nodes[j]]
                
                delta = 1 if c[i] == c[j] else 0
                
                term = (A_ij - (d_i * d_j) / (2 * M)) * (x[i] + x[j] - x[i] * x[j]) * delta
                Q_cp_config += term
        
        Q_cp_config *= (1 / (2 * M))
        
        return Q_cp_config

    def c_initialize(self):
        """
        Initialize c and x arrays.
        """
        N = self.G.number_of_nodes()
        c = np.arange(N)
        x = np.ones(N)
        return c, x

    def kronecker_delta(self, a, b):
        return 1 if a == b else 0

    def update_Q_cp_config(self, i, c, x, c_prime, x_prime, d_tilde, di, D, M):
        """
        Calculate the increment in Q_cp by changing node i's label from (c,x) to (c',x').
        """
        delta_Q_cp = (1/M) * ((
            d_tilde[c_prime, 1] + x_prime * d_tilde[c_prime, 0] - 
            (di * (D[c_prime, 1] + x_prime*D[c_prime, 0]) / (2*M)) - ((di**2) / (4*M)) * (x[i] + x_prime - x[i]*x_prime) *  self.kronecker_delta(c[i], c_prime)
        ) - (
            d_tilde[c[i], 1] + x[i] * d_tilde[c[i], 0] - 
            di * ((D[c[i], 1] + x_prime * D[c[i],0]) / (2*M)) + ((di**2) / (4*M)) * x[i]
        ))
        
        return delta_Q_cp

    def relabel_assignments(self, c):
        """
        Relabel the core-periphery assignments so that they are consecutive integers starting from 0.
        
        Parameters:
        - c: Original core-periphery assignments.
        
        Returns:
        - relabeled_c: Relabeled core-periphery assignments with consecutive integers.
        """
        # Use pandas to get unique values and map them to consecutive integers
        unique_labels = pd.Series(c).unique()
        relabel_map = {old_label: new_label for new_label, old_label in enumerate(unique_labels)}
        
        # Apply the mapping
        relabeled_c = np.array([relabel_map[label] for label in c])
        
        return relabeled_c

    def optimize(self, max_updates=1000):
        """
        Maximize Q_cp using label switching heuristic with a limit on the number of updates.
        """
        c, x = self.c_initialize()
        N = self.G.number_of_nodes()
        M = self.G.number_of_edges()
        A = nx.to_numpy_array(self.G)
        r_nodes = list(self.G.nodes)
        
        updates = 0
        for _ in range(max_updates):
            if updates >= max_updates:
                break
            
            nodes = list(range(N))
            random.shuffle(nodes)  # Scan nodes in random order

            degrees = dict(self.G.degree())  # Get the degree of each node
            D = self.compute_D(degrees, c, x)  # Calculate D for all blocks

            for i in nodes:
                best_delta_Q = 0
                best_c, best_x = c[i], x[i]
                di = self.G.degree[r_nodes[i]]  # Degree of node i
                evaluations = 0  # To count the number of evaluations for this node
                
                d_tilde = np.zeros((N, 2))  # d_tilde[i][0] for x=0, d_tilde[i][1] for x=1

                for j in range(N):
                    if i != j:
                        d_tilde[c[j], int(x[j])] += A[i, j]

                # Check all neighbors of i, but limit to 2di evaluations
                for j in self.G.neighbors(r_nodes[i]):
                    neighbor_index = r_nodes.index(j)

                    if evaluations >= 2 * di:
                        break
                    
                    for new_x in [0, 1]:
                        if evaluations >= 2 * di:
                            break
                        
                        delta_Q = self.update_Q_cp_config(i, c, x, c[neighbor_index], new_x, d_tilde, di, D, M)
                        evaluations += 1

                        if delta_Q > best_delta_Q:
                            best_delta_Q = delta_Q
                            best_c, best_x = c[neighbor_index], new_x

                # Update (ci, xi) if it improves Q_cp
                if best_delta_Q > 0:
                    c[i], x[i] = best_c, best_x
                    updates += 1  # Increment the update counter
                    # Update D for the new (c, x) configuration
                    D = self.compute_D(degrees, c, x)
                    
                if updates >= max_updates:
                    break  # Stop further updates if the limit is reached
        c = self.relabel_assignments(c)
        Qcp = self.compute_Q_cp_config(c, x)
        return c, x, Qcp


    def visualize_core_periphery(self, c, x):
        """
        Visualize the core-periphery structure on the given graph.
        
        Parameters:
        - graph: A NetworkX graph object.
        - c: Core-periphery assignments (list).
        - x: Core-periphery labels (list).
        """
        pos = nx.spring_layout(self.G)  # Position nodes using Fruchterman-Reingold force-directed algorithm
        
        # Generate a color map for the different 'c' values
        unique_c_values = sorted(set(c))
        colors = plt.cm.get_cmap('hsv', len(unique_c_values))
        color_map = {val: colors(i) for i, val in enumerate(unique_c_values)}
        
        for i in range(len(c)):
            node_color = 'white' if x[i] == 0 else color_map[c[i]]
            nx.draw_networkx_nodes(
                self.G, pos, nodelist=[i], 
                node_color=node_color, 
                edgecolors=color_map[c[i]], 
                linewidths=2, 
                node_size=500
            )
        # Draw edges
        nx.draw_networkx_edges(self.G, pos)
        
        # Draw labels
        nx.draw_networkx_labels(self.G, pos)
        
        # Display the plot
        plt.title('Core-Periphery Structure with Grouped Outlines')
        plt.show()

    def randomize_graph(self):
        """
        Generate a randomized version of the given graph while preserving degree distribution.
        """
        return nx.configuration_model([degree for _, degree in self.G.degree()])

    def statistical_test_on_core_periphery(self, num_randomization=500, max_updates=100, alpha=0.05):
        """
        Perform a statistical test on the detected core-periphery structure.
        
        Parameters:
        graph (networkx.Graph): The original graph.
        num_randomizations (int): Number of random graphs to generate for the test.
        max_updates (int): Maximum number of updates for the optimize function.
        alpha (float): Significance level for the test.
        
        Returns:
        bool: True if the core-periphery pair is significant, False otherwise.
        """
        # Step 1: Optimize Q_cp for the original graph
        c, x, Q_cp_original = self.optimize(self.G, max_updates=max_updates)
        
        # Step 2: Optimize Q_cp for randomized graphs and collect Q_cp values
        Q_cp_random_samples = []
        for _ in range(num_randomization):
            randomized_graph = self.randomize_graph(self.G)
            _, _, Q_cp_random = self.optimize(randomized_graph, max_updates=max_updates)
            Q_cp_random_samples.append(Q_cp_random)
        
        Q_cp_random_samples = np.array(Q_cp_random_samples)
        
        # Step 3: Use KDE to estimate the distribution of Q_cp in random graphs
        kde = gaussian_kde(Q_cp_random_samples)
        
        # Calculate the p-value
        p_value = kde.integrate_box_1d(-np.inf, Q_cp_original)
        
        # Step 4: Compare the p-value with alpha
        significant = p_value < alpha
        
        return significant, p_value
    

class Lap_Core :
    def __init__(self, G) :
        self.G = G



    def cp_connectivity(self, G, V_C, V_P):
        """
        Calculate the CP-connectivity as described in the formula.
        
        Parameters:
        - G: A networkx graph.
        - V_C: Set of nodes in the core.
        - V_P: Set of nodes in the periphery.
        
        Returns:
        - The CP-connectivity value.
        """
        # Calculate E(VC, VC): Number of edges within the core
        E_VC_VC = len([edge for edge in G.edges() if edge[0] in V_C and edge[1] in V_C])
        
        # Calculate E(VC, VP): Number of edges between the core and the periphery
        E_VC_VP = len([edge for edge in G.edges() if (edge[0] in V_C and edge[1] in V_P) or (edge[1] in V_C and edge[0] in V_P)])
        
        # Calculate E(VP, VP): Number of edges within the periphery
        E_VP_VP = len([edge for edge in G.edges() if edge[0] in V_P and edge[1] in V_P])
        
        # CP-connectivity formula
        cp_conn = E_VC_VC + E_VC_VP - E_VP_VP
        
        return cp_conn

    def calculate_vol(self, X, Y):
        """
        Calculate the volume (Vol) between sets X and Y.
        
        Vol(X, Y) = |X| * |Y| if X ≠ Y
                    0.5 * |X| * (|X| - 1) if X = Y
        """
        if X == Y:
            return 0.5 * len(X) * (len(X) - 1)
        else:
            return len(X) * len(Y)

    def calculate_cp_density(self, G, V_C, V_P, gamma = 1, beta=0.1):
        """
        Calculate the CP-density as described in the formula.
        
        Parameters:
        - G: A networkx graph.
        - V_C: Set of nodes in the core.
        - V_P: Set of nodes in the periphery.
        - gamma: A parameter for balancing core size. (Set to 0 to ignore size imbalance)
        - beta: A parameter guiding the target size for the core set.
        
        Returns:
        - The CP-density value.
        """
        # Calculate the edge counts
        E_VC_VC = len([edge for edge in G.edges() if edge[0] in V_C and edge[1] in V_C])
        E_VC_VP = len([edge for edge in G.edges() if (edge[0] in V_C and edge[1] in V_P) or (edge[1] in V_C and edge[0] in V_P)])
        E_VP_VP = len([edge for edge in G.edges() if edge[0] in V_P and edge[1] in V_P])
        
        # Calculate volumes
        Vol_VC_VC = self.calculate_vol(V_C, V_C)
        Vol_VC_VP = self.calculate_vol(V_C, V_P)
        Vol_VP_VP = self.calculate_vol(V_P, V_P)
        
        # Number of nodes in graph
        n = G.number_of_nodes()
        
        # CP-density formula
        cp_density = (
            (E_VC_VC / Vol_VC_VC) +
            (E_VC_VP / Vol_VC_VP) -
            (E_VP_VP / Vol_VP_VP) -
            gamma * abs(len(V_C) / n) -  # Gamma term set to 0 to ignore size imbalance
            beta  # Beta controls the target size of the core set
        )
        
        return cp_density


        
    def find_cut(self, G, scores, b):
        """
        Implements Algorithm 1: Find-Cut.
        
        Parameters:
        - G: A networkx graph.
        - scores: A numpy array of scores associated with the vertices.
        - b: A lower bound on the size of the core and periphery sets.
        - beta: A parameter guiding the target size for the core set.
        
        Returns:
        - V_C: The core set of vertices.
        - V_P: The periphery set of vertices.
        - best_nc: The optimal cut-off value nc.
        """

        
        # Step 1: Sort the vertices based on the scores
        sorted_indices = np.argsort(scores)[::-1]  # Sort in decreasing order
        
        # Step 2: Find the optimal nc
        best_nc = None
        max_objective = -np.inf
        
        n = len(scores)
        for nc in range(b, n - b + 1):
            X_C = set(sorted_indices[:nc])
            Y_C = set(sorted_indices[nc:])
            
            objective_value = self.calculate_cp_density(G, X_C, Y_C, gamma = 0)
            
            if objective_value > max_objective:
                max_objective = objective_value
                best_nc = nc
        
        # Step 3: Define the core set V_C and periphery set V_P
        V_C = set(sorted_indices[:best_nc])
        V_P = set(sorted_indices[best_nc:])
        
        return V_C, V_P, best_nc


    def low_rank_core(self, beta=None):
        """
        Implements Algorithm 2: LowRank-Core with a fix for the matrix type error.
        
        Parameters:
        - G: A networkx graph.
        - beta: Fraction of core vertices, if known.
        
        Returns:
        - core_set: The set of core vertices.
        - periphery_set: The set of periphery vertices.
        - scores: The LowRank-Core scores for all vertices.
        """
        G = self.G
        # Step 1: Compute the adjacency matrix A and its top 2 largest eigenvalues and corresponding eigenvectors
        A = nx.adjacency_matrix(G).astype(float)  # Convert to float type for eigs
        eigenvalues, eigenvectors = eigs(A, k=2, which='LR')
        
        # Step 2: Compute A_hat, the rank-2 approximation of A
        A_hat = np.outer(eigenvectors[:, 0], eigenvectors[:, 0]) * eigenvalues[0] + \
                np.outer(eigenvectors[:, 1], eigenvectors[:, 1]) * eigenvalues[1]
        
        # Step 3: Threshold the entries of A_hat at 0.5
        A_hat_thresh = np.where(A_hat > 0.5, 1, 0)
        
        # Convert A_hat_thresh back to a graph to compute degrees
        G_hat = nx.from_numpy_array(A_hat_thresh)  # Use from_numpy_array instead of from_numpy_matrix
        
        # Step 4: Compute the LowRank-Core scores as the degrees of A_hat_thresh
        scores = np.array([G_hat.degree(i) for i in range(G_hat.number_of_nodes())])
        
        # Step 5 and 6: Determine the core and periphery sets based on beta or use Find-Cut
        if beta is not None:
            # If beta is known
            n = len(scores)
            core_size = int(beta * n)
            core_indices = np.argsort(scores)[-core_size:]  # Top βn vertices with largest scores
            core_set = set(core_indices)
            periphery_set = set(range(n)) - core_set
        else:
            # If beta is unknown, use Find-Cut algorithm from earlier
            b = 5  # Lower bound on the size of the core and periphery sets
            core_set, periphery_set, _ = self.find_cut(G, scores, b)  # Use beta=0 in Find-Cut
            
        

        return scores, core_set, self.calculate_cp_density(G, core_set, periphery_set, gamma=0)


    def lap_core(self, beta=None):
        """
        Implements Algorithm 3: Lap-Core to detect core-periphery structure in a graph.
        
        Parameters:
        - G: A networkx graph.
        - beta: Fraction of core vertices, if known.
        
        Returns:
        - core_set: The set of core vertices.
        - periphery_set: The set of periphery vertices.
        - scores: The Lap-Core scores for all vertices.
        """
        G = self.G
        # Step 1: Compute the random-walk Laplacian L = D^(-1)A
        A = nx.adjacency_matrix(G).astype(float)  # Adjacency matrix A
        D = np.diag(np.array(A.sum(axis=1)).flatten())  # Degree matrix D as a 2D array
        D_inv = np.linalg.inv(D)  # Inverse of D
        L = D_inv @ A  # Random-walk Laplacian

        # Step 2: Compute the smallest non-zero eigenvalue of L and its corresponding eigenvector
        eigenvalues, eigenvectors = eigs(L, k=2, which='SR')  # Compute the smallest two eigenvalues ('SR' - smallest real)
        lambda_n = eigenvalues[1]  # Smallest non-zero eigenvalue
        v_n = eigenvectors[:, 1]  # Corresponding eigenvector

        # The eigenvector components give the Lap-Core scores of the vertices
        scores = np.real(v_n)

        # Step 3 and 4: Determine the core and periphery sets based on beta or use Find-Cut
        if beta is not None:
            # If beta is known
            n = len(scores)
            core_size = int(beta * n)
            core_indices = np.argsort(scores)[-core_size:]  # Top βn vertices with largest scores
            core_set = set(core_indices)
            periphery_set = set(range(n)) - core_set
        else:
            # If beta is unknown, use Find-Cut algorithm from earlier
            b = 3  # Lower bound on the size of the core and periphery sets
            core_set, periphery_set, _ = self.find_cut(G, scores, b)  # Use beta=0 in Find-Cut
        
        return scores, core_set, self.calculate_cp_density(G, core_set, periphery_set, gamma=0)


    def lap_sgn_core(self):
        """
        Implements Algorithm 4: LapSGN-Core to detect core-periphery structure in a graph.
        
        Parameters:
        - G: A networkx graph.
        
        Returns:
        - core_set: The set of core vertices.
        - periphery_set: The set of periphery vertices.
        - scores: The Lap-Core scores for all vertices.
        """
        G = self.G
        # Step 1: Compute the random-walk Laplacian L = D^(-1)A
        A = nx.adjacency_matrix(G).astype(float)  # Adjacency matrix A
        D = np.diag(np.array(A.sum(axis=1)).flatten())  # Degree matrix D as a 2D array
        D_inv = np.linalg.inv(D)  # Inverse of D
        L = D_inv @ A  # Random-walk Laplacian

        # Step 2: Compute the smallest non-zero eigenvalue of L and its corresponding eigenvector
        eigenvalues, eigenvectors = eigs(L, k=2, which='SR')  # Compute the smallest two eigenvalues ('SR' - smallest real)
        v_n = np.real(eigenvectors[:, 1])  # Corresponding eigenvector (real part)

        # Step 3: Set zi = sign(v_n[i]) for each vertex i
        z = np.sign(v_n)

        # Step 4-8: Determine the core and periphery sets by evaluating the objective function
        def evaluate_partition(z):
            core_set = set(np.where(z >= 0)[0])
            periphery_set = set(np.where(z < 0)[0])
            return core_set, periphery_set

        # Partition 1: zi >= 0 -> core, zi < 0 -> periphery
        core_set_1, periphery_set_1 = evaluate_partition(z)
        n1 = self.calculate_cp_density(G, core_set_1, periphery_set_1, 1)
        # Partition 2: zi <= 0 -> core, zi > 0 -> periphery (reversed)
        core_set_2, periphery_set_2 = evaluate_partition(-z)
        n2 = self.calculate_cp_density(G, core_set_2, periphery_set_2, 1)

        # Step 6-7: Choose the partition with the smaller ncut value
        if n1 < n2:
            core_set, periphery_set = core_set_1, periphery_set_1
        elif n2 < n1:
            core_set, periphery_set = core_set_2, periphery_set_2
        else:
            core_set, periphery_set = None, None  # No clear separation

        return z, core_set, self.calculate_cp_density(G, core_set, periphery_set, gamma=0)
    

    def plot_core_periphery_graph(self, core_indices):
        G = self.G
        # Get the node labels (strings) from the graph using the indices
        core_nodes = [list(G.nodes)[i] for i in core_indices]
        
        # Set node color: 'red' for core nodes and 'blue' for periphery nodes
        node_colors = ['red' if node in core_nodes else 'blue' for node in G.nodes]
        
        # Draw the graph
        pos = nx.spring_layout(G)  # spring layout for better visualization
        nx.draw(G, pos, with_labels=True, node_color=node_colors, node_size=10, font_size=0, font_color='white')
        
        # Highlight core nodes with larger size
        nx.draw_networkx_nodes(G, pos, nodelist=core_nodes, node_color='red', node_size=30)

        plt.show()



class Surprise :
    def __init__(self, G, A) :
        self.G = G
        self.A = A

    def calculate_parameters_enhanced(self, group_1, group_2):
        G = self.G
        
        # 노드 쌍의 수 계산
        V = math.comb(G.number_of_nodes(), 2)
        V_bullet = math.comb(len(group_1), 2)
        V_circle = math.comb(len(group_2), 2)
        
        # 엣지 수 계산
        L = G.number_of_edges()
        l_bullet = len([edge for edge in G.edges if edge[0] in group_1 and edge[1] in group_1])
        l_circle = len([edge for edge in G.edges if edge[0] in group_2 and edge[1] in group_2])
        
        # 가중치 있는 경우와 없는 경우 모두 처리
        W = 0
        w_bullet = 0
        w_circle = 0

        for u, v, data in G.edges(data=True):
            weight = data.get('weight', 1)  # 가중치가 없으면 기본값 1 사용
            W += weight
            if u in group_1 and v in group_1:
                w_bullet += weight
            elif u in group_2 and v in group_2:
                w_circle += weight
            
        return V, V_bullet, V_circle, L, l_bullet, l_circle, W, w_bullet, w_circle



    def calculate_MEH(self, V, V_bullet, V_circle, L, l_bullet, l_circle, W, w_bullet, w_circle):
        V_top = V - (V_bullet + V_circle)
        l_top = L - (l_bullet + l_circle)
        w_top = W - (w_bullet + w_circle)
        
        t1_numerator = (
            math.comb(V_bullet, l_bullet) *
            math.comb(V_circle, l_circle) *
            math.comb(V_top, l_top)
        )
        
        t1_denominator = math.comb(V, L)
        
        if w_circle > l_circle :
            t2_numerator = (
                math.comb(w_bullet-1, w_bullet-l_bullet) *
                math.comb(w_circle-1, w_circle-l_circle) *
                math.comb(w_top-1, w_top-l_top ) 
            )

            t2_denominator = math.comb(W-1, L-1)
        else :
            t2_numerator = 1
            t2_denominator = 1

        MEH_value = (t1_numerator / t1_denominator) * (t2_numerator / t2_denominator)
        
        return MEH_value

    def calculate_intra_connection_probability(self, coreset):
        G = self.G
        n = len(coreset)

        # 가능한 연결 수 계산
        possible_connections = math.comb(n, 2)
        actual_connections = len([edge for edge in G.edges if edge[0] in coreset and edge[1] in coreset])
        # 연결 확률 p 계산
        if possible_connections == 0:
            return 0  # 노드가 하나 이하일 경우 연결 확률은 0
        p = actual_connections / possible_connections
        return p

    def core_periphery_optimization(self, iterations=10):
        G = self.G
        N = G.number_of_nodes()
        A = nx.to_numpy_array(G, weight='weight')
        x = np.random.choice([0, 1], size=N)  # 초기 노드 분할 (0: periphery, 1: core)

        def calculate_surprise(x):
            group_1 = np.where(x == 1)[0]  # core
            group_2 = np.where(x == 0)[0]  # periphery

            V, V_bullet, V_circle, L, l_bullet, l_circle, W, w_bullet, w_circle = self.calculate_parameters_enhanced(group_1, group_2)
            return self.calculate_MEH(int(V), int(V_bullet), int(V_circle), int(L), int(l_bullet), int(l_circle), int(W), int(w_bullet), int(w_circle))

        best_x = x.copy()
        best_q = calculate_surprise(x)

        for _ in range(iterations):

            permuted_nodes = np.random.permutation(N)  # N개의 노드를 무작위 순서로 섞음
            for node in permuted_nodes:
                x[node] = 1 - x[node]  # 노드 이동 (core ↔ periphery)
                try :
                    q = calculate_surprise(x)
                except :
                    continue
                
                if q > best_q:  # 개선이 안 되면 롤백
                    x[node] = 1 - x[node]
                else:
                    best_q = q
                    best_x = x.copy()
            
            if np.random.rand() > 0.5:
                # Move some nodes in a random manner for perturbation
                flip_nodes = np.random.choice(N, size=max(int(round(N/10, 0)), 3) , replace=False)
                x[flip_nodes] = 1 - x[flip_nodes]
                try :
                    q = calculate_surprise(x)
                except :
                    continue
                if q > best_q:
                    x[flip_nodes] = 1 - x[flip_nodes]
                else:
                    best_q = q
                    best_x = x.copy()


        #p11 < p22 인 경우 core를 바꿈
        set1 = np.where(best_x==1)[0]
        set2 = np.where(best_x==0)[0]

        set1_p = self.calculate_intra_connection_probability(set1)
        set2_p = self.calculate_intra_connection_probability(set2)

        if set1_p < set2_p :
            best_x = 1 - best_x
            core_set = set2
        else :
            core_set = set1

        return best_x, core_set, best_q


    def plot_core_periphery_graph(self, core_indices):
        G = self.G
        # Get the node labels (strings) from the graph using the indices
        core_nodes = [list(G.nodes)[i] for i in core_indices]
        
        # Set node color: 'red' for core nodes and 'blue' for periphery nodes
        node_colors = ['red' if node in core_nodes else 'blue' for node in G.nodes]
        
        # Draw the graph
        pos = nx.spring_layout(G)  # spring layout for better visualization
        nx.draw(G, pos, with_labels=True, node_color=node_colors, node_size=10, font_size=0, font_color='white')
        
        # Highlight core nodes with larger size
        nx.draw_networkx_nodes(G, pos, nodelist=core_nodes, node_color='red', node_size=30)

        plt.show()
