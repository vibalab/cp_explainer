import numpy as np
import numba
import networkx as nx
import random
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from scipy.stats import gaussian_kde

class KM_Config:
    def __init__(self, G, A):
        self.G = G
        self.A = A

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def compute_D(degrees, c, x, N):
        D = np.zeros((max(c) + 1, 2))
        for node in range(N):
            D[c[node], int(x[node])] += degrees[node]
        return D

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def compute_Q_cp_config(A, degrees, c, x, N, M):
        Q_cp_config = 0
        for i in range(N):
            for j in range(N):
                A_ij = A[i, j]
                d_i = degrees[i]
                d_j = degrees[j]
                delta = 1 if c[i] == c[j] else 0
                term = (A_ij - (d_i * d_j) / (2 * M)) * (x[i] + x[j] - x[i] * x[j]) * delta
                Q_cp_config += term
        Q_cp_config *= (1 / (2 * M))
        return Q_cp_config

    def c_initialize(self):
        N = self.G.number_of_nodes()
        c = np.arange(N)
        x = np.ones(N)
        return c, x

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def update_Q_cp_config(i, c, x, c_prime, x_prime, d_tilde, di, D, M):
        delta_Q_cp = (1 / M) * ((
            d_tilde[c_prime, 1] + x_prime * d_tilde[c_prime, 0] - 
            (di * (D[c_prime, 1] + x_prime * D[c_prime, 0]) / (2 * M)) - ((di ** 2) / (4 * M)) * (x[i] + x_prime - x[i] * x_prime) * (1 if c[i] == c_prime else 0)
        ) - (
            d_tilde[c[i], 1] + x[i] * d_tilde[c[i], 0] - 
            di * ((D[c[i], 1] + x_prime * D[c[i], 0]) / (2 * M)) + ((di ** 2) / (4 * M)) * x[i]
        ))
        return delta_Q_cp

    def relabel_assignments(self, c):
        unique_labels = pd.Series(c).unique()
        relabel_map = {old_label: new_label for new_label, old_label in enumerate(unique_labels)}
        relabeled_c = np.array([relabel_map[label] for label in c])
        return relabeled_c

    def optimize(self, max_updates=1000):
        c, x = self.c_initialize()
        N = self.G.number_of_nodes()
        M = self.G.number_of_edges()
        A = nx.to_numpy_array(self.G)
        r_nodes = list(self.G.nodes)
        
        updates = 0
        for _ in range(max_updates):
            if updates >= max_updates:
                break

            nodes = np.arange(N)
            np.random.shuffle(nodes)  # Use NumPy's random shuffling
            
            degrees = np.array([self.G.degree(node) for node in self.G.nodes()])  # Degrees as NumPy array
            D = self.compute_D(degrees, c, x, N)

            for i in nodes:
                best_delta_Q = 0
                best_c, best_x = c[i], x[i]
                di = degrees[i]
                evaluations = 0

                d_tilde = np.zeros((max(c) + 1, 2))  # Adjusted to consider the max value of c

                for j in range(N):
                    if i != j:
                        d_tilde[c[j], int(x[j])] += A[i, j]

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
                    D = self.compute_D(degrees, c, x, N)
                    
                if updates >= max_updates:
                    break  # Stop further updates if the limit is reached
                
        c = self.relabel_assignments(c)
        Qcp = self.compute_Q_cp_config(A, degrees, c, x, N, M)
        return c, x, Qcp

    def visualize_core_periphery(self, c, x):
        pos = nx.spring_layout(self.G)  # Position nodes using Fruchterman-Reingold force-directed algorithm
        
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

        nx.draw_networkx_edges(self.G, pos)
        plt.title('Core-Periphery Structure with Grouped Outlines')
        plt.show()

    def randomize_graph(self):
        return nx.configuration_model([degree for _, degree in self.G.degree()])

    def statistical_test_on_core_periphery(self, num_randomization=500, max_updates=100, alpha=0.05):
        c, x, Q_cp_original = self.optimize(max_updates=max_updates)
        
        Q_cp_random_samples = []
        for _ in range(num_randomization):
            randomized_graph = self.randomize_graph()
            randomized_A = nx.to_numpy_array(randomized_graph)
            km_config_random = KM_Config(randomized_graph, randomized_A)
            _, _, Q_cp_random = km_config_random.optimize(max_updates=max_updates)
            Q_cp_random_samples.append(Q_cp_random)
        
        Q_cp_random_samples = np.array(Q_cp_random_samples)
        kde = gaussian_kde(Q_cp_random_samples)
        
        p_value = kde.integrate_box_1d(-np.inf, Q_cp_original)
        significant = p_value < alpha
        
        return significant, p_value