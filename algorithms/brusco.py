import numpy as np
import numba
from scipy.stats import pearsonr
import pygad

class Brusco:
    def __init__(self, G, A, n):
        self.G = G
        self.A = A
        self.n = n

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

    def fitness_function_brusco_metric(self, ga_instance, solution, solution_idx):
        core_indices = [i for i, gene in enumerate(solution) if gene > 0.5]
        if not core_indices:
            return -1
        Z = self.brusco_metric(core_indices)
        return Z if np.isfinite(Z) else -1
    

    def run_genetic_algorithm(self, iter=1000):
        ga_instance_borgatti = pygad.GA(
            num_generations=iter,
            num_parents_mating=5,
            fitness_func=self.fitness_function_brusco_metric,
            sol_per_pop=20,
            num_genes=self.n,
            gene_type=float,
            gene_space=[0, 1],  # Genes will be floats between 0 and 1
            mutation_type="random",
            mutation_percent_genes=10,
        )

        # Run the genetic algorithm for Borgatti and Everett correlation
        ga_instance_borgatti.run()

        return ga_instance_borgatti