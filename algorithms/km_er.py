import numpy as np
import numba
import networkx as nx
import random
import matplotlib.pyplot as plt
import pandas as pd

class KM_ER:
    def __init__(self, G, A):
        self.G = G
        self.A = A
        self.p = self.calculate_density(G)

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def B_c_x_matrix(c, x):
        N = len(x)
        B = np.zeros((N, N))
        for i in range(N):
            for j in range(i+1, N):
                if (x[i] == 1 or x[j] == 1) and c[i] == c[j]:
                    B[i, j] = B[j, i] = 1
        return B

    def calculate_density(self, graph):
        N = graph.number_of_nodes()
        M = graph.number_of_edges()
        if N <= 1:
            return 0
        max_edges = N * (N - 1) / 2
        p = M / max_edges
        return p

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def Q_cp(A, c, x, p, B_c_x):
        N = len(x)
        Q_cp_value = 0
        q = np.zeros(len(np.unique(c)))
        for i in range(N):
            for j in range(i):
                q[c[i]] += (A[i, j] - p) * B_c_x[i, j]
                Q_cp_value += (A[i, j] - p) * B_c_x[i, j]
        return Q_cp_value, q

    def c_initialize(self):
        N = self.G.number_of_nodes()
        c = np.arange(N)
        x = np.ones(N)
        return c, x

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def kronecker_delta(a, b):
        return 1 if a == b else 0

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def update_Q_cp(i, c, x, c_prime, x_prime, p, d_tilde, N_tilde):
        def kronecker_delta(a, b):
            return 1 if a == b else 0

        delta_Q_cp = (
            d_tilde[c_prime, 1] + x_prime * d_tilde[c_prime, 0] - 
            p * (N_tilde[c_prime, 1] + x_prime * N_tilde[c_prime, 0] - kronecker_delta(c[i], c_prime))
        ) - (
            d_tilde[c[i], 1] + x[i] * d_tilde[c[i], 0] - 
            p * (N_tilde[c[i], 1] + x[i] * N_tilde[c[i], 0] - x[i])
        )
        return delta_Q_cp

    def relabel_assignments(self, c):
        unique_labels = pd.Series(c).unique()
        relabel_map = {old_label: new_label for new_label, old_label in enumerate(unique_labels)}
        relabeled_c = np.array([relabel_map[label] for label in c])
        return relabeled_c

    def optimize(self, max_updates=1000):
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
            random.shuffle(nodes)
            
            for i in nodes:
                best_delta_Q = 0
                best_c, best_x = c[i], x[i]
                di = self.G.degree[r_nodes[i]]
                evaluations = 0

                d_tilde = np.zeros((N, 2))
                N_tilde = np.zeros((N, 2))
                
                for j in range(N):
                    if i != j:
                        d_tilde[c[j], int(x[j])] += A[i, j]
                        N_tilde[c[j], int(x[j])] += 1

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

                if best_delta_Q > 0:
                    c[i], x[i] = best_c, best_x
                    updates += 1
                    
                if updates >= max_updates:
                    break
        c = self.relabel_assignments(c)
        B_c_x = self.B_c_x_matrix(c, x)
        Qcp, Qc = self.Q_cp(A, c, x, p, B_c_x)

        return c, x, Qcp, Qc

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def create_B_matrix(c, x, core_id, N):
        B = np.zeros((N, N))
        for i in range(N):
            for j in range(i + 1, N):
                if c[i] == core_id and c[j] == core_id:
                    if x[i] == 1 or x[j] == 1:
                        B[i, j] = B[j, i] = 1
        return B

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def calculate_Q_cp_BE(A, B, p, alpha=0.5):
        N = A.shape[0]  # Number of nodes

        # Calculate P_B
        P_B = np.sum(B) / (N * (N - 1) / 2)
        
        # Numerator: Sum over all pairs (i, j)
        numerator = 0.0
        for i in range(N):
            for j in range(i):
                numerator += (A[i, j] - p) * (B[i, j] - P_B)
        
        # Denominator: Square root of product of sums
        sum_A_diff_sq = 0.0
        sum_B_diff_sq = 0.0
        for i in range(N):
            for j in range(i):
                sum_A_diff_sq += (A[i, j] - p) ** 2
                sum_B_diff_sq += (B[i, j] - P_B) ** 2

        denominator = np.sqrt(sum_A_diff_sq * sum_B_diff_sq)
        
        if denominator == 0:
            return 0.0  # To avoid division by zero
        
        Q_cp_BE = numerator / denominator
        
        return alpha * Q_cp_BE

    def sidak_correction(self, alpha, C):
        alpha_sidak = 1 - (1 - alpha)**(1 / C)
        return alpha_sidak

    def calculate_multi_core_Q_cp_BE(self, c, x, alpha=0.01):
        A = self.A
        total_Q_cp_BE = 0
        significant_cores = []
        unique_core_ids = np.unique(c)
        N = A.shape[0]
        p = np.sum(A) / (N * (N - 1))
        
        alpha_sidak = self.sidak_correction(alpha, len(unique_core_ids))

        for core_id in unique_core_ids:
            B = self.create_B_matrix(c, x, core_id, N)
            Q_cp_BE = self.calculate_Q_cp_BE(A, B, p, alpha_sidak)
            total_Q_cp_BE += Q_cp_BE

            if Q_cp_BE <= alpha_sidak:
                significant_cores.append(core_id)
        
        return significant_cores, total_Q_cp_BE
    

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
                node_size=100
            )

        # Draw edges
        nx.draw_networkx_edges(self.G, pos)
        
        
        # Display the plot
        plt.title('Core-Periphery Structure with Grouped Outlines')
        plt.show()