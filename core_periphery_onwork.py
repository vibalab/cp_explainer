import numpy as np

#######Zhang et al.
def initialize_parameters(A):
    # 초기 파라미터 설정
    num_nodes = A.shape[0]
    p = np.random.rand(2,2)
    p[0,1] = p[1,0]
    gamma_0 = np.random.rand() 
    gamma_1 = 1 - gamma_0
    node_assignments = np.random.choice([0, 1], size=num_nodes, p=[gamma_0, gamma_1])
    return p, gamma_0, gamma_1, node_assignments

def expectation_step(A, p, gamma_0, gamma_1, prev_assignment = None):
    num_nodes = A.shape[0]
    node_assignments = prev_assignment
    q = np.zeros((num_nodes, 2))
    
    for i in range(num_nodes):
        p_1 = 0
        p_0 = 0
        for c_i in [0, 1] :
            for j in range(num_nodes):
                if i != j:
                    c_j = node_assignments[j]
                    if c_i == 1 :
                        if c_j == 0:
                            p_1 +=( p[1][0]**A[i, j]) * ((1 - p[1][0])**(1 - A[i, j])) 
                        else :
                            p_1 += (p[1][1]**A[i, j]) * ((1 - p[1][1])**(1 - A[i, j])) 
                    else :
                        if c_j == 0:
                            p_0 += (p[1][0]**A[i, j]) * ((1 - p[1][0])**(1 - A[i, j])) 
                        else :
                            p_0 += (p[0][0]**A[i, j]) * ((1 - p[0][0])**(1 - A[i, j])) 


        q[i, 0] = p_0/(p_0 + p_1)
        q[i, 1] = p_1/(p_0 + p_1)

    return q

def maximization_step(A, q):
    num_nodes = A.shape[0]
    
    gamma_0 = q[:, 0].mean()
    gamma_1 = 1 - gamma_0


    epsilon=1e-10
    p_00_num = 0
    p_00_den = epsilon
    p_11_num = 0
    p_11_den = epsilon
    p_01_num = 0
    p_01_den = epsilon
    
    new_assignment = [assignment.argmax() for assignment in q]

    for i in range(num_nodes):
        for j in range(i + 1, num_nodes):
            q_i = new_assignment[i]
            q_j = new_assignment[j]
            if q_i == 0 and q_j == 0 :
                p_00_den += 1
                if A[i,j] == 1 :
                    p_00_num += 1
            elif q_i == 1 and q_j == 1 :
                p_11_den += 1
                if A[i,j] == 1 :
                    p_11_num += 1
            else :
                p_01_den += 1
                if A[i,j] == 1:
                    p_01_num += 1

    
    p_00 = p_00_num / p_00_den
    p_11 = p_11_num / p_11_den
    p_01 = p_01_num / p_01_den

    p = [[p_00, p_01], [p_01, p_11]]
    return p, gamma_0, gamma_1, new_assignment

def em_algorithm(A, max_iterations=100, tolerance=1e-4):
    p, gamma_0, gamma_1, node_assignments = initialize_parameters(A)
    for iteration in range(max_iterations):
        q = expectation_step(A, p, gamma_0, gamma_1, node_assignments)
        p_new, gamma_0_new, gamma_1_new, assignment_new = maximization_step(A, q)
        
        # 파라미터 업데이트
        if np.allclose(p, p_new, atol=tolerance) and np.isclose(gamma_0, gamma_0_new, atol=tolerance) and np.isclose(gamma_1, gamma_1_new, atol=tolerance):
            break
        p, gamma_0, gamma_1, node_assignments = p_new, gamma_0_new, gamma_1_new, assignment_new
    
    return p, gamma_0, gamma_1, q

p, gamma_0, gamma_1, node_assignments = initialize_parameters(A)
print(p, gamma_0, gamma_1)
q = expectation_step(A, p, gamma_0, gamma_1, node_assignments)

